/*jslint node: true*/
'use strict';

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

function Filter() {
}

exports.FunctionCall = FunctionCall;
exports.Chain = Chain;
exports.Filter = Filter;