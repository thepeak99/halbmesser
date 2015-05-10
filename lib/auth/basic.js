/*jslint node: true */
'use strict';

var crypto = require('crypto');
var buffertools = require('buffertools');

var registry = require('../registry');
    
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

registry.addFunction('auth_pap', auth_pap);
registry.addFunction('auth_chap', auth_chap);