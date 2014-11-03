"use strict";
var Server = function (client, name) {
    this._name = name;
    this._client = client;
    this._users = [];
    this._groups = [];
    this._commands = [];
};

Server.prototype.getName = function() {
    return this._name;
};

Server.prototype.getClient = function() {
    return this._client;
};

Server.prototype.getCommands = function () {
    return this._commands;
};

Server.prototype.getUsers = function () {
    return this._servers;
};

Server.prototype.getGroups = function () {
    return this._groups;
};

Server.prototype.addCommand = function (command) {
    this._commands.push(command);
    return command;
};

Server.prototype.addGroup = function (group) {
    this._groups.push(group);
    return group;
};

Server.prototype.addUser = function (user) {
    this._users.push(user);
    return user;
};

Server.prototype.setProperty = function (attribute, newValue) {
    this.__properties[attribute] = newValue;
};

module.exports = Server;