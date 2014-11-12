"use strict";
var Command = function (command, callback, context) {
    this._name = command;
    this._callback = callback;
    this._context = context;
    this._properties = {};
};

Command.prototype.getName = function () {
    return this._name;
};

Command.prototype.getContext = function() {
    return this._context;
};

Command.prototype.getCallback = function () {
    return this._callback;
};

Command.prototype.setCallback = function (callback) {
    this._callback = callback;
};

Command.prototype.getValue = function () {
    return this._properties.id;
};

Command.prototype.getProperties = function () {
    return this._properties;
};

Command.prototype.setProperty = function (name, property) {
    this._properties[name] = property;
};

module.exports = Command;