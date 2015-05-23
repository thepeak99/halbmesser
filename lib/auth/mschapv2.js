/*jslint node: true, bitwise: true */
'use strict';

var crypto = require('crypto');
var buffertools = require('buffertools');

var magic1 = new Buffer([
    0x4D, 0x61, 0x67, 0x69, 0x63, 0x20, 0x73, 0x65, 0x72, 0x76,
    0x65, 0x72, 0x20, 0x74, 0x6F, 0x20, 0x63, 0x6C, 0x69, 0x65,
    0x6E, 0x74, 0x20, 0x73, 0x69, 0x67, 0x6E, 0x69, 0x6E, 0x67,
    0x20, 0x63, 0x6F, 0x6E, 0x73, 0x74, 0x61, 0x6E, 0x74
]);

var magic2 = new Buffer([
    0x50, 0x61, 0x64, 0x20, 0x74, 0x6F, 0x20, 0x6D, 0x61, 0x6B,
    0x65, 0x20, 0x69, 0x74, 0x20, 0x64, 0x6F, 0x20, 0x6D, 0x6F,
    0x72, 0x65, 0x20, 0x74, 0x68, 0x61, 0x6E, 0x20, 0x6F, 0x6E,
    0x65, 0x20, 0x69, 0x74, 0x65, 0x72, 0x61, 0x74, 0x69, 0x6F,
    0x6E
]);

function to7Bits(buf) {
    var i,
        out = [],
        carry = 0;
    
    for (i = 0; i < buf.length; i += 1) {
        out.push((carry | (buf[i] >> (i % 7))) & 0xfe);
        carry = (buf[i] << (7 - (i % 7))) & 0xff;
    }
    out.push(carry);
    
    return new Buffer(out);
}

function zeroPad(buf, size) {
    return Buffer.concat([buf, new Buffer(new Array(1 + size - buf.length).join('\u0000'))]);
}

function toUcs2(str) {
    return new Buffer(str, 'ucs2');
}

function ntPasswordHash(password) {
    return crypto.createHash('md4').update(password).digest();
}

function challengeHash(peerChallenge, authenticatorChallenge, username) {
    var sha = crypto.createHash('sha1');
    
    sha.update(peerChallenge);
    sha.update(authenticatorChallenge);
    sha.update(username);
    
    return sha.digest().slice(0, 8);
}

function challengeResponse(challenge, passwordHash) {
    var encDes1, encDes2, encDes3, zPasswordHash;
    
    zPasswordHash = zeroPad(passwordHash, 21);

    encDes1 = crypto.createCipheriv('des-ecb', to7Bits(zPasswordHash.slice(0, 7)), '').update(challenge);
    encDes2 = crypto.createCipheriv('des-ecb', to7Bits(zPasswordHash.slice(7, 14)), '').update(challenge);
    encDes3 = crypto.createCipheriv('des-ecb', to7Bits(zPasswordHash.slice(14)), '').update(challenge);
    
    return Buffer.concat([encDes1, encDes2, encDes3]);
}

function generateNTResponse(authenticatorChallenge, peerChallenge, userName, password) {
    var challenge, passwordHash;
    challenge = challengeHash(peerChallenge, authenticatorChallenge, userName);
    passwordHash = ntPasswordHash(password);
    return challengeResponse(challenge, passwordHash);
}

function generateAuthenticatorResponse(password, ntResponse, peerChallenge, authenticatorChallenge, userName) {
    var passwordHash, passwordHashHash, challenge, sha1, digest;
    
    passwordHash = ntPasswordHash(password);
    passwordHashHash = ntPasswordHash(passwordHash);
    
    sha1 = crypto.createHash('sha1');
    sha1.update(passwordHashHash);
    sha1.update(ntResponse);
    sha1.update(magic1);
    digest = sha1.digest();
    
    challenge = challengeHash(peerChallenge, authenticatorChallenge, userName);
    
    sha1 = crypto.createHash('sha1');
    sha1.update(digest);
    sha1.update(challenge);
    sha1.update(magic2);
    digest = sha1.digest();
    
    return 'S=' + digest.toString('hex').toUpperCase();
}

function auth_mschapv2(params, attrs, cb) {
    var authenticatorChallenge, peerChallenge, ntResponse,
        myNtResponse, password, ident, username, out,
        authenticatorResponse, ms_attrs;

    ms_attrs = params.req.attributes['Vendor-Specific'];
    
    if (ms_attrs === undefined || ms_attrs['MS-CHAP2-Response'] === undefined) {
        cb(false);
        return;
    }
    
    authenticatorChallenge = ms_attrs['MS-CHAP-Challenge'];
    peerChallenge = ms_attrs['MS-CHAP2-Response'].slice(2, 18);
    ntResponse = ms_attrs['MS-CHAP2-Response'].slice(26);
    ident = ms_attrs['MS-CHAP2-Response'][0];
    password = toUcs2(params.user.attributes['Cleartext-Password']);
    username = params.req.attributes['User-Name'];
    myNtResponse = generateNTResponse(authenticatorChallenge, peerChallenge, username, password);
    
    if (buffertools.equals(ntResponse, myNtResponse)) {
        authenticatorResponse = generateAuthenticatorResponse(password, ntResponse,
                                                              peerChallenge, authenticatorChallenge,
                                                              username);
        params.res.code = 'Access-Accept';
        out = new Buffer(43);
        out.writeUInt8(ident, 0);
        out.write(authenticatorResponse, 1);
        params.res.attributes['MS-CHAP2-Success'] = out;
        cb(true);
    } else {
        cb(false);
    }
}


function start_module(api) {
    api.registry.addFunction('auth_mschapv2', auth_mschapv2);
}

exports.start_module = start_module;