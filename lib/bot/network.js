"use strict";
var _ = require('lodash'),
    when = require('when'),
    pluginLoader = require('../plugin-loader'),
    User = require('./user'),
    Command = require('./command');

var Network = function (name, client, config) {
    this._name = name;
    this._client = client;
    this._config = config;
    this._plugins = {};
    this._users = [];
    this._groups = [];
    this._commands = [];
    this._loader = new pluginLoader().init(this);
};

// network functions
Network.prototype.getName = function () {
    return this._name;
};

Network.prototype.getConfig = function () {
    return this._config;
};

// Plugin Functions
Network.prototype.addPlugin = function (pluginName, plugin) {
    this._plugins[pluginName] = plugin;
};

Network.prototype.getPlugins = function () {
    return this._plugins;
};

// Command Functions
Network.prototype.getCommands = function () {
    return this._commands;
};

Network.prototype.addCommand = function (command, callback, context) {
    var newCommand = new Command(command, callback, context);
    this._commands.push(newCommand);
    return newCommand;
};

Network.prototype.deleteCommand = function (commandToDelete) {
    var self = this;
    _.remove(this._commands, function (command) {
        return command === commandToDelete;
    });
};

Network.prototype.getCommandById = function (id) {
    _.find(this._commands, function (command) {
        return command.getId() === id;
    });
};

Network.prototype.getCommandByName = function (name) {
    return _.find(this._commands, function (command) {
        return command.getName() === name;
    });
};

// User functions
Network.prototype.getUsers = function () {
    return this._servers;
};

Network.prototype.addUser = function (properties) {
    var newUser = new User(properties);
    this._users.push(newUser);
    return newUser;
};

Network.prototype.getUserByAccount = function (account) {
    return _.find(this._users, function (user) {
        return user.getAccount() == account;
    });
};

Network.prototype.getClient = function () {
    return this._client;
};

Network.prototype.getGroups = function () {
    return this._groups;
};

Network.prototype.addGroup = function (group) {
    this._groups.push(group);
    return group;
};

Network.prototype.setProperty = function (attribute, newValue) {
    this.__properties[attribute] = newValue;
};

module.exports = Network;