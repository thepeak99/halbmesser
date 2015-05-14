/*jslint node: true*/
'use strict';

function filter(params, attrs, cb) {
    params.api.registry.getFilter(attrs[0]).run(params, cb);
}

function set(params, attrs, cb) {
    params.api.sprache.setValue(params, attrs[0], attrs[1]);
    cb(true);
}

function brk(params, attrs, cb) {
    cb(true);
}

function chain(params, attrs, cb) {
    params.api.registry.getChain(attrs[0]).run(params, cb);
}

function debug(params, attrs, cb) {
    console.log('Params : ');
    console.log(params);
    console.log('Attrs : ' + attrs);
    cb(false);
}

function start_module(api) {
    api.registry.addFunction('set', set);
    api.registry.addFunction('break', brk);
    api.registry.addFunction('filter', filter);
    api.registry.addFunction('chain', filter);
    api.registry.addFunction('debug', debug);
}

exports.start_module = start_module;