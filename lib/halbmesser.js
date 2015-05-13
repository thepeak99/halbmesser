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

function main() {
    nconf.argv().env().file({ file: 'config/halbmesser.json' });

    radius.add_dictionary(nconf.get('dictionaries'));

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
    
    console.log(remote);
    console.log(nas);
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
    
    console.log(request);
    
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
    
    console.log(params);

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