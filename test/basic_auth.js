/*jslint node: true nomen: true*/
/*global describe, it, before, beforeEach*/
'use strict';

var rewire = require('rewire');
var expect = require('chai').expect;
var basic = rewire('../lib/auth/basic');

describe('Basic Authentication', function () {
    var params, auth_pap, auth_chap;
    
    before(function () {
        auth_pap = basic.__get__('auth_pap');
        auth_chap = basic.__get__('auth_chap');
    });
    
    beforeEach(function () {
        params = {
            req: {
                attributes: {
                    'User-Name': 'User'
                }
            },
            user: {
                attributes: {
                    'Cleartext-Password': 'clientPass'
                }
            },
            res: {
                code: 'Access-Reject'
            }
        };
    });
    
    describe('pap', function () {
        it('should authenticate with PAP', function (done) {
            params.req.attributes['User-Password'] = 'clientPass';

            auth_pap(params, null, function (r) {
                expect(r).to.be.equal(true);
                expect(params.res.code).to.be.equal('Access-Accept');
                done();
            });
        });
    
        it('should fail to authenticate with PAP if the password is incorrect', function (done) {
            params.req.attributes['User-Password'] = 'wrongPass';
            
            auth_pap(params, null, function (r) {
                expect(r).to.be.equal(false);
                expect(params.res.code).to.be.equal('Access-Reject');
                done();
            });
        });
        
        it('should ignore if packet does not carry PAP info', function (done) {
            auth_pap(params, null, function (r) {
                expect(r).to.be.equal(false);
                expect(params.res.code).to.be.equal('Access-Reject');
                done();
            });
        });
    });

    describe('chap', function () {
        it('should authenticate with CHAP', function (done) {
            params.req.attributes['CHAP-Challenge'] = new Buffer('91768eb5f10720bae1ddc3d6df3c1274', 'hex');
            params.req.attributes['CHAP-Password'] = new Buffer('6100a0c14131b69a04ab344a21054483d1', 'hex');
        
            auth_chap(params, null, function (r) {
                expect(r).to.be.equal(true);
                expect(params.res.code).to.be.equal('Access-Accept');
                done();
            });
        });

        it('should fail to authenticate with CHAP if the password is incorrect', function (done) {
            params.req.attributes['CHAP-Challenge'] = new Buffer('91768eb5f10720bae1ddc3d6df3c1274', 'hex');
            params.req.attributes['CHAP-Password'] = new Buffer('6100a0c14131b69a04ab344a21054483d2', 'hex');
        
            auth_chap(params, null, function (r) {
                expect(r).to.be.equal(false);
                expect(params.res.code).to.be.equal('Access-Reject');
                done();
            });
        });
        
        it('should ignore if packet does not carry CHAP info', function (done) {
            auth_pap(params, null, function (r) {
                expect(r).to.be.equal(false);
                expect(params.res.code).to.be.equal('Access-Reject');
                done();
            });
        });
    });
});