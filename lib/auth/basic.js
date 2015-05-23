/*jslint node: true */
'use strict';

var crypto = require('crypto');
var buffertools = require('buffertools');

function auth_chap(params, attrs, cb) {
    var hashedPassword, r;
    
    if (params.req.attributes['CHAP-Password'] === undefined) {
        cb(false);
        return;
    }

    hashedPassword = crypto.createHash('md5').update(Buffer.concat([
        params.req.attributes['CHAP-Password'].slice(0, 1),
        new Buffer(params.user.attributes['Cleartext-Password']),
        params.req.attributes['CHAP-Challenge']
    ])).digest();
    
    r = buffertools.compare(hashedPassword, params.req.attributes['CHAP-Password'].slice(1)) === 0;
    
    if (r) {
        params.res.code = 'Access-Accept';
    }
    cb(r);
}

function auth_pap(params, attrs, cb) {
    var r;
    
    if (params.req.attributes['User-Password'] === undefined) {
        cb(false);
        return;
    }
    
    r = params.user.attributes['Cleartext-Password'] === params.req.attributes['User-Password'];
    
    if (r) {
        params.res.code = 'Access-Accept';
    }
    cb(r);
}

function start_module(api) {
    api.registry.addFunction('auth_pap', auth_pap);
    api.registry.addFunction('auth_chap', auth_chap);
}

exports.start_module = start_module;