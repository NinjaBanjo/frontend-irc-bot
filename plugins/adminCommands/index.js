"use strict";
var Bot = require('../../lib/bot'),
    pluginLoader = require('../../lib/plugin-loader'),
    auth = require('../../lib/auth'),
    _ = require('lodash'),
    moment = require('moment');

var adminCommands = function (network, config) {
};

adminCommands.prototype.init = function (network, config) {
    this._self = this;
    this._network = network;
    this._cofnig = config;

    network.addCommand('restart', this.restart);
    network.addCommand('reload', this.reloadPlugins);
    network.addCommand('uptime', this.uptime);

    // User management commands
    network.addCommand('listusers', this.listUsers);
    network.addCommand('adduser', this.addUser);
    network.addCommand('updateuser', this.updateUser);
    network.addCommand('deleteuser', this.deleteUser);
    network.addCommand('listgroups', this.listGroups);
    network.addCommand('addgroup', this.addGroup);
    network.addCommand('updategroup', this.updateGroup);
    network.addCommand('deletegroup', this.deleteGroup);

    // Permissions commands
    network.addCommand('restrictions', this.listRestrictions);
    network.addCommand('restrict', this.restrict);
    network.addCommand('unrestrict', this.unrestrict);
};

adminCommands.prototype.uptime = function (network, command, params, from) {
    var a = moment();
    var b = moment().subtract(process.uptime(), 'seconds');
    network.getClient().notice(from, (a.diff(b, 'days') == 0 ? 'Less than a day' : a.diff(b, 'day(s)')));
};

adminCommands.prototype.listRestrictions = function (network, command, params, from) {
    function sortComparison(a, b) {
        if (a.__properties.command < b.__properties.command)
            return -1;
        if (a.__properties.command > b.__properties.command)
            return 1;
        return 0;
    }

    var commands = auth.getAllCommands(),
        commandsList = '';
    _.forEach(commands.sort(sortComparison), function (command, index) {
        var separator = (index < 1 ? '' : ', ');
        commandsList += separator + command.getCommand() + ':' + command.getValue();
    });

    network.getClient().notice(from, commandsList);
};

adminCommands.prototype.restrict = function (client, command, params, from) {
    if (typeof params === "string" && params.length > 0) {
        var args = params.split(' ');
        auth.restrictCommand(args[0], args[1])
            .then(function (res) {
                client.notice(from, res.message);
            }, function (res) {
                client.notice(from, res.message);
            });
    }
};

adminCommands.prototype.unrestrict = function (network, command, params, from) {
    auth.unrestrictCommand(client, params)
        .then(function (res) {
            network.getClient().notice(from, res.message);
        }, function (res) {
            network.getClient().notice(from, res.message);
        });
};

adminCommands.prototype.listUsers = function (network, command, params, from) {
    var users = network.getAllUsers(client._name),
        usersList = '';
    if (users.length > 0) {
        _.forEach(users, function (user, index) {
            usersList += (index > 0 ? ', ' + user.getAccount() : user.getAccount());
        });
    } else {
        usersList = 'There are currently no users in the system';
    }
    network.getClient().notice(from, usersList);
};

adminCommands.prototype.addUser = function (network, command, params, from) {
    var args = params.split(' '),
        optionSets = _.rest(params, 1);
    network.auth.getAccountName(args[0]).then(function (res) {
        network.auth.createUser(res.account, args[1])
            .then(function (res) {
                if (typeof res === "object") {
                    network.getClient().notice(from, res.message);
                } else {
                    throw new Error('res is not an object');
                }
            });
    }, function (res) {
        network.getClient().notice(from, res.message);
    });
};

adminCommands.prototype.updateUser = function (network, command, params, from, to) {
    var args = params.split(' '),
        optionsSet = _.rest(args, 1),
        keys = _.groupBy(optionsSet, function (num, index) {
            index++;
            return index % 2;
        });
    keys = _.object(keys[1], keys[0]);
    network.auth.updateUser(_.first(args), keys)
        .then(function (res) {
            if (typeof res === "object") {
                network.getClient().notice(from, res.message);
            } else {
                throw new Error('res is not an object');
            }
        }, function (res) {
            if (typeof res === "object") {
                network.getClient().notice(from, res.message);
            } else {
                throw new Error('res is not an object');
            }
        });
};

adminCommands.prototype.deleteUser = function (network, command, params, from, to) {
    network.deleteUser(params)
        .then(function (res) {
            if (typeof res === "object") {
                network.getClient().notice(from, res.message);
            } else {
                throw new Error('res is not an object');
            }
        }, function (res) {
            network.getClient().notice(from, res.message);
        });
};

adminCommands.prototype.listGroups = function (network, command, params, from) {
    var groupsList = '';
    if (network.getAllGroups().length > 0) {
        _.forEach(network.getAllGroups(), function (group, index) {
            groupsList += (index > 0 ? ', ' + group.getName() : group.getName());
        });
    } else {
        groupsList = 'There are currently no groups in the system';
    }
    network.getClient().notice(from, groupsList);
};

adminCommands.prototype.addGroup = function (network, command, params, from, to) {
    var args = params.split(' ');
    network.auth.createGroup(args[0], args[1])
        .then(function (res) {
            if (typeof res === "object") {
                network.getClient().notice(from, res.message);
            } else {
                throw new Error('res is not an object');
            }
        });
};

adminCommands.prototype.updateGroup = function (client, command, params, from) {
    var args = params.split(' '),
        optionsSet = _.rest(args, 1),
        keys = _.groupBy(optionsSet, function (num, index) {
            index++;
            return index % 2;
        });
    keys = _.object(keys[1], keys[0]);
    auth.updateGroup(_.first(args), keys)
        .then(function (res) {
            if (typeof res === "object") {
                client.notice(from, res.message);
            } else {
                throw new Error('res is not an object');
            }
        }, function (res) {
            if (typeof res === "object") {
                client.notice(from, res.message);
            } else {
                throw new Error('res is not an object');
            }
        });
};

adminCommands.prototype.deleteGroup = function (client, command, params, from) {
    auth.deleteGroup(params)
        .then(function (res) {
            if (typeof res === "object") {
                client.notice(from, res.message);
            } else {
                throw new Error('res is not an object');
            }
        });
};

adminCommands.prototype.reloadPlugins = function (client, command, params, from, to) {
    client.whois(from, function (res) {
        if (res !== undefined && res.account !== undefined && res.account === 'NinjaBanjo' || res.account === 'jedimind') {
            adminCommands.prototype.__scope.plugins = [];
            adminCommands.prototype.__scope.commands = {};
            pluginLoader.prototype.init.call(adminCommands.prototype.__scope);
        } else {
            client.notice(from, 'You are not authorized to use that command');
            Bot.prototype.log('Unauthorized attempt to use `reload by ' + to);
        }
    });
};

adminCommands.prototype.restart = function (client, command, params, from, to) {
    client.whois(from, function (res) {
        if (res !== undefined && res.account !== undefined && res.account === 'NinjaBanjo' || res.account === 'jedimind') {
            // Because the bot is meant to be run with forever by exiting the process forever will restart the bot for us
            process.exit(0);
        } else {
            client.notice(from, 'You are not authorized to use that command');
            Bot.prototype.log('Unauthorized attempt to use `restart by ' + to);
        }
    });
}

module.exports = adminCommands;