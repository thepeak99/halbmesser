/*jslint node: true nomen: true*/
/*global describe, it, before*/
'use strict';

var rewire = require('rewire');
var expect = require('chai').expect;

var mschapv2 = rewire('../lib/auth/mschapv2');

describe('mschapv2', function () {
    var generateAuthenticatorResponse, toUcs2, ntPasswordHash,
        challengeHash, challengeResponse, generateNTResponse,
        zeroPad, to7Bits;
    
    before(function () {
        generateAuthenticatorResponse = mschapv2.__get__('generateAuthenticatorResponse');
        toUcs2 = mschapv2.__get__('toUcs2');
        ntPasswordHash = mschapv2.__get__('ntPasswordHash');
        challengeHash = mschapv2.__get__('challengeHash');
        challengeResponse = mschapv2.__get__('challengeResponse');
        generateNTResponse = mschapv2.__get__('generateNTResponse');
        zeroPad = mschapv2.__get__('zeroPad');
        to7Bits = mschapv2.__get__('to7Bits');
    });
    
    it('should do the 7bit padding properly', function () {
        var input, expected, r;
        
        input = new Buffer('1234567');
        expected = new Buffer('30988c6642a8d86e', 'hex');
        
        r = to7Bits(input);
        expect(r).to.be.deep.equal(expected);
    });
    
    it('should zero-pad', function () {
        var input, expected, r;
        
        input = new Buffer('1234567');
        expected = new Buffer('1234567\u0000\u0000\u0000');
        r = zeroPad(input, 10);
        expect(r).to.be.deep.equal(expected);
    });
    
    it('should convert to UCS2', function () {
        var input, expected, r;
        
        input = 'clientPass';
        expected = new Buffer('63006C00690065006E0074005000610073007300', 'hex');
        r = toUcs2(input);
        expect(r).to.be.deep.equal(expected);
    });
    
    it('should calculate PasswordHash', function () {
        var expected, password, r;
        password = toUcs2('clientPass');
        expected = new Buffer('44EBBA8D5312B8D611474411F56989AE', 'hex');
        r = ntPasswordHash(password);
        expect(r).to.be.deep.equal(expected);
    });
    
    it('should calculate ChallengeHash', function () {
        var authChallenge, peerChallenge, username, expected, r;
        
        username = 'User';
        authChallenge = new Buffer('5B5D7C7D7B3F2F3E3C2C602132262628', 'hex');
        peerChallenge = new Buffer('21402324255E262A28295F2B3A337C7E', 'hex');
        expected = new Buffer('D02E4386BCE91226', 'hex');
        r = challengeHash(peerChallenge, authChallenge, username);
        expect(r).to.be.deep.equal(expected);
    });
    
    it('should calculate ChallengeResponse', function () {
        var challenge, passwordHash, expected, r;
        
        challenge = new Buffer('D02E4386BCE91226', 'hex');
        passwordHash = new Buffer('44EBBA8D5312B8D611474411F56989AE', 'hex');
        expected = new Buffer('82309ECD8D708B5EA08FAA3981CD83544233114A3D85D6DF', 'hex');
        r = challengeResponse(challenge, passwordHash);
        expect(r).to.be.deep.equal(expected);
    });
    
    it('should generate the NT Response from the username and the password', function () {
        var authChallenge, peerChallenge, userName, password, expected, r;
        
        userName = 'User';
        password = toUcs2('clientPass');
        authChallenge = new Buffer('5B5D7C7D7B3F2F3E3C2C602132262628', 'hex');
        peerChallenge = new Buffer('21402324255E262A28295F2B3A337C7E', 'hex');
        expected = new Buffer('82309ECD8D708B5EA08FAA3981CD83544233114A3D85D6DF', 'hex');
        r = generateNTResponse(authChallenge, peerChallenge, userName, password);
        expect(r).to.be.deep.equal(expected);
    });
    
    it('should calculate AuthenticatorResponse', function () {
        var ntResponse, authChallenge, peerChallenge, userName, password, expected, r;
        
        userName = 'User';
        password = toUcs2('clientPass');
        ntResponse = new Buffer('82309ECD8D708B5EA08FAA3981CD83544233114A3D85D6DF', 'hex');
        authChallenge = new Buffer('5B5D7C7D7B3F2F3E3C2C602132262628', 'hex');
        peerChallenge = new Buffer('21402324255E262A28295F2B3A337C7E', 'hex');
        expected = 'S=407A5589115FD0D6209F510FE9C04566932CDA56';
        r = generateAuthenticatorResponse(password, ntResponse, peerChallenge, authChallenge, userName);
        
        expect(r).to.be.deep.equal(expected);
    });
    
    it('should validate a user from RADIUS', function () {
        var params = {
            req : {
                attributes: {
                    'User-Name': 'User'
                }
            }
        };
        
    });
});