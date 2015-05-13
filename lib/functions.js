/*jslint node: true*/
'use strict';

function filter(params, attrs, cb) {
    return params.api.registry.getFilter(attrs[0]).run(params);
}

function set(params, attrs, cb) {
    params.api.sprache.setValue(params, attrs[0], attrs[1]);
    return true;
}

function brk(params, attrs, cb) {
    return true;
}

function chain(params, attrs) {
    return params.api.registry.getChain(attrs[0]).run(params);
}

function start_module(api) {
    api.registry.addFunction('set', set);
    api.registry.addFunction('break', brk);
    api.registry.addFunction('filter', filter);
    api.registry.addFunction('chain', filter);
}

exports.start_module = start_module;