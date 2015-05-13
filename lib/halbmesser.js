/*jslint node: true */

'use strict';

var radius = require('radius');
var dgram = require('dgram');
var nconf = require('nconf');

var registry = require('./registry');
var sprache = require('./sprache/sprache');

var api = {
    sprache: sprache,
    registry: registry,
    config: nconf
};

require('./functions').start_module(api);
require('./auth/basic').start_module(api);

var authServer, acctServer;
var processedReqs = {};

authServer = dgram.createSocket('udp4');
acctServer = dgram.createSocket('udp4');

function convertAttrs(attrs) {
    var out = [];

    console.log(attrs);

    Object.keys(attrs).forEach(function (key) {
        var value,
            keyValue;

        value = attrs[key];
        if (typeof value === 'string') {
            value = value.trim();
        }
        keyValue = [key, value];
        
        if (radius.attributes_map[-1][key] === undefined) {
            Object.keys(radius.attributes_map).every(function (vendor) {
                if (radius.attributes_map[vendor][key] !== undefined) {
                    out.push(['Vendor-Specific', vendor, [keyValue]]);
                    return false;
                }
                return true;
            });
        } else {
            out.push(keyValue);
        }
    });

    return out;
}

function main() {
    nconf.argv().env().file({ file: 'config/halbmesser.json' });

    radius.add_dictionary(nconf.get('dictionaries'));
    radius.load_dictionaries();

    Object.keys(nconf.get('modules')).forEach(function (module) {
        require(module).start_module(api, nconf.get('modules')[module]);
    });
    
    sprache.load('config/main.spr');
    
    Object.keys(nconf.get('clients')).forEach(function (ip) {
        processedReqs[ip] = [];
    });
    
    authServer.bind(nconf.get('authPort'));
    acctServer.bind(nconf.get('acctPort'));
}

function isRetransmit(request, remote) {
    if (processedReqs[remote.address].indexOf(request.identifier) !== -1) {
        return true;
    }
    
    processedReqs[remote.address].push(request.identifier);
    
    if (processedReqs[remote.address].length > 100) {
        processedReqs[remote.address].splice(0, 1);
    }
        
    return false;
}

function procPacket(message, remote) {
    var nas, params, request, clients;
    
    clients = nconf.get('clients');

    nas = clients[remote.address];
    
    if (nas === undefined) {
        //Unknown client, we'll ignore this packet
        return;
    }
    
    nas.attributes = {
        Ip: remote.address
    };

    request = radius.decode({
        packet: message,
        secret: nas.secret
    });
    
    if (isRetransmit(request, remote)) {
        return;
    }
    
    return {
        req: request,
        res: {attributes: {}, code: ''},
        nas: nas,
        user: {attributes: {}},
        
        api: api
    };
}

acctServer.on('message', function (message, remote) {
    var response, params;
    
    params = procPacket(message, remote);
    
    //We apply default values to the response here
    params.res.code = 'Accounting-Response';

    //And run the chain!
    registry.getChain('onAccount').run(params, function () {
        response = radius.encode_response({
            packet: params.req,
            secret: params.client.secret,
            code: params.res.code,
            attributes: params.res.attributes
        });
        
        acctServer.send(response, 0, response.length, remote.port, remote.address);
    });
});

authServer.on('message', function (message, remote) {
    var response, params;
    
    params = procPacket(message, remote);

    //Default values
    params.res.code = 'Access-Reject';
    
    params.res.attributes['Framed-Protocol'] = 'PPP';
    params.res.attributes['Framed-Compression'] = 'Van-Jacobson-TCP-IP';
    params.res.attributes['Acct-Interim-Interval'] = 300;

    //Running the chain!
    registry.getChain('onAuth').run(params, function () {
        response = radius.encode_response({
            packet: params.req,
            secret: params.nas.secret,
            code: params.res.code,
            attributes: convertAttrs(params.res.attributes)
        });
    
        authServer.send(response, 0, response.length, remote.port, remote.address);
    });
});

main();