"use strict";
var Command = function (properties) {
    if (typeof properties !== "Object") {
        this.__properties = properties;
    } else {
        throw new Error('Properties must be an object');
    }
};

Command.prototype.getId = function () {
    return this.__properties.id;
};

Command.prototype.getCommand = function () {
    return this.__properties.command;
};

Command.prototype.getValue = function () {
    return this.__properties.value;
};

Command.prototype.setValue = function (newValue) {
    this.__properties.value = newValue;
};

module.exports = Command;