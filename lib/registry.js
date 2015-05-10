/*jslint node: true */
'use strict';

function Registry() {
    this.functions = {};
    this.filters = {};
    this.chains = {};
}

Registry.prototype.addFunction = function(name, func) {
    this.functions[name] = func;
}

Registry.prototype.addFilter = function(name, filter) {
    this.filters[name] = filter;
}

Registry.prototype.addChain = function(name, chain) {
    return this.chains[name] = chain;
}

Registry.prototype.getFunction = function(name) {
    return this.functions[name];
}

Registry.prototype.getChain = function(name) {
    return this.chains[name];
}

Registry.prototype.getFilters = function(name) {
    return filters[name];
}

module.exports = new Registry();