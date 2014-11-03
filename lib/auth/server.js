"use strict";
var Server = function (properties) {
    this._commands = [];
    this._users = [];
    this._groups = [];

    if (typeof properties !== "Object") {
        this.__properties = properties;
    } else {
        throw new Error('Properties must be an object');
    }
};

Server.prototype.getcommands = function () {
    return this._commands;
};

Server.prototype.addUser = function (user) {
    this._users.push(user);
    console.log(this._users);
};

Server.prototype.setProperty = function (attribute, newValue) {
    this.__properties[attribute] = newValue;
};

module.exports = Server;