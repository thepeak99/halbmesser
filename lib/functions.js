/*jslint node: true*/
'use strict';

var registry = require('./registry');

function has(params, attrs) {
    if (attrs[0] == 'req') {
        return req.attributes[req] ;
    }
}

function set(params, attrs) {
    if (attrs[0] === 'req') {
        params.req[attrs[1]] = attrs[2];
    } else if (attrs[0] === 'user') {
        params.user[attrs[1]] = attrs[2];
    }
    
    return true;
}

function brk(params, attrs) {
    return true;
}


registry.addFunction('set', set);
registry.addFunction('break', brk);