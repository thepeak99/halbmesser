/*jslint node: true*/
'use strict';

var fs = require('fs');

var grammar = require('./grammar');

function load(filename) {
    grammar.parse(fs.readFileSync(filename, {encoding: 'ascii'}));
}

function getValue(params, name) {
    var match, attrRegex = /^(user|client|request|response)\|(\w+)$/;

    if (attrRegex.test(name)) {
        match = name.match(attrRegex);
        return params[match[0]][name];
    }
    
    return name;
}

function setValue(params, name, newValue) {
    var match, attrRegex = /^(user|client|request|response)\|(\w+)$/;

    if (attrRegex.test(name)) {
        match = name.match(attrRegex);
        params[match[0]][name] = newValue;
    }
    
    throw 'Error';
}

function FunctionCall(fun, attrs) {
    this.fun = fun;
    this.attrs = attrs;
}

FunctionCall.prototype.run = function (params) {
    return this.fun(params, this.attrs);
};

function Chain() {
    this.elements = [];
}

Chain.prototype.run = function (params) {
    //If an element returns true, it means the value has been accepted, the chain stops
    //A chain that has been interrupted, lets the flow continue. 
    //A chain that hasn't been interrupted, breaks.
    
    return this.elements.every(function (element) {
        return !element.run(params);
    });
};

Chain.prototype.addElement = function (element) {
    this.elements.push(element);
};

function Filter(exp) {
    this.exp = exp;
}

function Expression(right, op, left) {
    this.right = right;
    this.left = left;
    this.op = op;
}

Expression.prototype.run = function (params) {
    if (this.op === '&') {
        return this.right.run() && this.left.run;
    }
    
    if (this.op === '|') {
        return this.right.run() || this.left.run;
    }
    
    if (this.op === '==') {
        return getValue(params, this.right) === getValue(params, this.left);
    }
    
    if (this.op === '~=') {
        return new RegExp(getValue(params, this.left)).test(getValue(params, this.right));
    }
    
    if (this.op === '>') {
        return getValue(params, this.right) > getValue(params, this.left);
    }
    
    if (this.op === '<') {
        return getValue(params, this.right) < getValue(params, this.left);
    }
};

exports.getValue = getValue;
exports.setValue = setValue;
exports.FunctionCall = FunctionCall;
exports.Chain = Chain;
exports.Expression = Expression;
exports.Filter = Filter;
exports.load = load;