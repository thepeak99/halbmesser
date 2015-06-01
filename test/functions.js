/*jslint node: true nomen: true*/
/*global describe, it, before, beforeEach*/
'use strict';

var rewire = require('rewire');
var sinon = require('sinon');
var expect = require('chai').expect;

var functions = rewire('../lib/functions');
var sprache = rewire('../lib/sprache/sprache');
var registry = rewire('../lib/registry');

describe('Sprache Functions', function () {
    var params, brk, set, accept, reject, filter, chain;
    
    before(function () {
        set = functions.__get__('set');
        brk = functions.__get__('brk');
        accept = functions.__get__('accept');
        reject = functions.__get__('reject');
        filter = functions.__get__('filter');
        chain = functions.__get__('chain');
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
                code: 'Access-Reject',
                attributes: {}
            },
            api: {
                sprache: sprache,
                registry: new (registry.__get__('Registry'))()
            }
        };
    });
    
    describe('brk', function () {
        it('should return always true', function (done) {
            var brk = functions.__get__('brk');

            brk(null, null, function (r) {
                expect(r).to.be.equal(true);
                done();
            });
        });
    });

    describe('set', function () {
        it('should modify a parameter and return always true', function (done) {
            set(params, ['res|Framed-IP-Address', '192.168.1.1'], function (r) {
                expect(r).to.be.equal(true);
                expect(params.res.attributes['Framed-IP-Address']).to.be.equal('192.168.1.1');
                done();
            });
        });
    });
    
    describe('accept', function () {
        it('should always return true and set the response code to Access-Accept', function (done) {
            accept(params, null, function (r) {
                expect(r).to.be.equal(true);
                expect(params.res.code).to.be.equal('Access-Accept');
                done();
            });
        });
    });
    
    describe('reject', function () {
        it('should always return true and set the response code to Access-Reject', function (done) {
            params.res.code = 'Access-Accept';
            reject(params, null, function (r) {
                expect(r).to.be.equal(true);
                expect(params.res.code).to.be.equal('Access-Reject');
                done();
            });
        });
    });

    describe('filter', function () {
        it('should call a filter', function () {
            var spy = sinon.spy();
            params.api.registry.addFilter('testFilter', { run: spy });
            filter(params, ['testFilter'], function () {});
            expect(spy.calledOnce).to.be.equal(true);
        });
    });
    
    describe('chain', function () {
        it('should call a chain', function () {
            var spy = sinon.spy();
            params.api.registry.addChain('testChain', { run: spy });
            chain(params, ['testChain'], function () {});
            expect(spy.calledOnce).to.be.equal(true);
        });
    });
});