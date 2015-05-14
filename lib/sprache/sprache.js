/*jslint node: true, regexp: true*/
'use strict';

var fs = require('fs');

var grammar = require('./grammar');

function load(filename) {
    grammar.parse(fs.readFileSync(filename, {encoding: 'ascii'}));
}

function getValue(params, name) {
    var match,
        attrRegex = /^(user|nas|req|res)\|([\w\-]+)$/,
        regexRegex = /\/(.*)\//;

    if (attrRegex.test(name)) {
        match = name.match(attrRegex);
        return params[match[1]].attributes[match[2]];
    } else if (name === 'NULL') {
        return undefined;
    } else if (regexRegex.test(name)) {
        return new RegExp(regexRegex.exec(name)[1]);
    }
    return name;
}

function setValue(params, name, value) {
    var match,
        attrRegex = /^(user|nas|req|res)\|([\w\-]+)$/;
    
    if (attrRegex.test(name)) {
        match = name.match(attrRegex);
        params[match[1]].attributes[match[2]] = value;
        return;
    }
    
    throw 'Error';
}

function FunctionCall(fun, attrs) {
    this.fun = fun;
    this.attrs = attrs;
}

FunctionCall.prototype.run = function (params, cb) {
    this.fun(params, this.attrs, cb);
};

function Chain() {
    this.elements = [];
}

Chain.prototype.run = function (params, cb) {
    //If an element returns true, it means the value has been accepted, the chain stops
    //A chain that has been interrupted, lets the flow continue. 
    //A chain that hasn't been interrupted, breaks (returns true).
    
    var idx = -1, elements = this.elements;
    function iterator(r) {
        idx += 1;
        if (r === false && idx < elements.length) {
            elements[idx].run(params, iterator);
        } else {
            cb(!r);
        }
    }
    
    iterator(false);
};

Chain.prototype.addElement = function (element) {
    this.elements.push(element);
};

function Filter(exp) {
    this.exp = exp;
}

Filter.prototype.run = function (params, cb) {
    //If a filter matches, it returns FALSE, so the chain goes on
    //if it fails, it returns true, thus "accepting" the value and making the chain stop
    console.log(this.exp.run(params));
    cb(!this.exp.run(params));
};

function Expression(left, op, right) {
    this.right = right;
    this.left = left;
    this.op = op;
}

Expression.prototype.run = function (params, cb) {
    if (this.op === '&') {
        return this.left.run(params) && this.right.run(params);
    }
    
    if (this.op === '|') {
        return this.left.run(params) || this.right.run(params);
    }
    
    if (this.op === '==') {
        return getValue(params, this.left) === getValue(params, this.right);
    }
    
    if (this.op === '~=') {
        return getValue(params, this.right).test(getValue(params, this.left));
    }
    
    if (this.op === '>') {
        return getValue(params, this.left) > getValue(params, this.right);
    }
    
    if (this.op === '<') {
        return getValue(params, this.left) < getValue(params, this.right);
    }
};

exports.getValue = getValue;
exports.setValue = setValue;
exports.FunctionCall = FunctionCall;
exports.Chain = Chain;
exports.Expression = Expression;
exports.Filter = Filter;
exports.load = load;