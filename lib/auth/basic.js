/*jslint node: true */
'use strict';

var crypto = require('crypto');
var buffertools = require('buffertools');

function auth_chap(params) {
    var hashedPassword = crypto.createHash('md5').update(Buffer.concat([
        params.reqAttrs['CHAP-Password'].slice(0, 1),
        new Buffer(params.userAttrs['Cleartext-Password']),
        params.reqAttrs['CHAP-Challenge']
    ])).digest();
    
    return buffertools.compare(hashedPassword, params.reqAttrs['CHAP-Password'].slice(1)) === 0;
}

function auth_pap(params) {
    return params.userAttrs['Cleartext-Password'] === params.reqAttrs['User-Password'];
}

function start_module(api) {
    api.registry.addFunction('auth_pap', auth_pap);
    api.registry.addFunction('auth_chap', auth_chap);
}

exports.start_module = start_module;