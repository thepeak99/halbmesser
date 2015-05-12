/*jslint node: true*/
'use strict';

var sprache;

function filter(params, attrs) {
    return params.registry.getFilter(attrs[0]).run(params);
}

function set(params, attrs) {
    sprache.setValue(params, attrs[0], attrs[1]);
    return true;
}

function brk(params, attrs) {
    return true;
}

function start_module(api) {
    sprache = api.sprache;
    api.registry.addFunction('set', set);
    api.registry.addFunction('break', brk);
    api.registry.addFunction('filter', filter);
}

exports.start_module = start_module;