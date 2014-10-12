"use strict";
var Bot = require('../bot'),
    sqlite3 = require('sqlite3').verbose(),
    db = new sqlite3.Database('auth.sqlite'),
    User = require('./user.js'),
    Group = require('./group.js'),
    Command = require('./command.js'),
    when = require('when'),
    _ = require('lodash');

var auth = function () {
    // This does absolutely nothing
    return true;
};

auth.init = function () {
    var d = when.defer();
    // Store application scope reference so we can use it later for auth look ups
    auth.__commands = [];

    auth.createTables()
        .then(auth.fetchUsersFromDb)
        .then(auth.fetchGroupsFromDb)
        .then(auth.fetchCommandPermissionsFromDb)
        .then(function () {
            d.resolve('Auth Initialized');
        });
    return d.promise;
};

auth.authorize = function (client, command, nick) {
    var d = when.defer();
    // parts of below may be skipped if we end up storing the users and groups in objects. Trying to keep this async.

    if (auth.isCommandRegistered(command) === false) {
        d.resolve({err: null, auth: true});
        return d.promise;
    }

    auth.getAccountName(client, nick)
        .then(function (res) {
            if (typeof res === "object") {
                auth.getUser(res.account)
                    .then(function (res) {
                        var isUserOwner = res.user.__properties.isOwner || null,
                            group = auth.getGroup(res.user.getGroupId());
                        if (typeof group !== "object") {
                            throw new Error('expected group to be an object');
                        }
                        // Guarantee permissions for owners
                        if (isUserOwner === 1) {
                            d.resolve({err: null, auth: true});
                        }
                        if (auth.getCommand(command).getValue() <= group.getPower()) {
                            d.resolve({err: null, auth: true});
                        } else {
                            d.reject({
                                err: 'User does not have sufficient power to use this command',
                                message: 'You are not allowed to use this command'
                            });
                        }
                    }, function (res) {
                        // Elevate any errors
                        d.reject(res);
                    });
            } else {
                d.reject({err: 'expected res to be an object', message: 'Couldn\'t authorize user'});
            }
        }, function (res) {
            // Pass the error back up the stack
            d.reject(res);
        });
    return d.promise;
};

auth.isCommandRegistered = function (command) {
    var commandObject = auth.getCommand(command);
    if (typeof commandObject === "object") {
        return true;
    }
    return false;
};

auth.getCommand = function (unknown) {
    // Take an argument of either account name or id to resolve to user object
    var method, i, len, name;
    if (typeof unknown === 'number') {
        method = 'id';
    } else {
        method = 'command';
    }
    switch (method) {
    case 'command':
        for (i = 0, len = auth.__commands.length; i < len; i++) {
            if (auth.__commands[i].getCommand() === unknown) {
                // Resolve if found
                return auth.__commands[i];
            }
        }
        return 'Error: No command found';
    case 'id':
        for (i = 0, len = auth.__commands.length; i < len; i++) {
            if (auth.__commands[i].getId() === unknown) {
                return auth.__commands[i];
            }
        }
        return 'Error: No command found';
    default:
        return 'You must provide a method for lookup';
    }
};

auth.getAllCommands = function () {
    var commands = [];
    _.forEach(auth.__commands, function (command, index) {
        commands[index] = command;
    });
    return commands;
};

auth.createTables = function () {
    var d = when.defer(),
        existingTables = [],
        creatingTables = false;
    // Create tables in our db if they don't yet exist. (handles initial setup so we don't need to do it outside of context.
    db.serialize(function () {
        db.all("SELECT name FROM sqlite_master WHERE type='table'", function (err, res) {
            _.forEach(res, function (row) {
                if (row.name !== 'sqlite_sequence') {
                    existingTables.push(row.name);
                }
            });
            db.serialize(function () {
                if (_.indexOf(existingTables, 'users') === -1) {
                    creatingTables = true;
                    Bot.prototype.log('Creating users table in auth');
                    // Create require tables if not exists and on any error, HALT
                    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, account VARCHAR(16) NOT NULL UNIQUE, group_id DEFAULT(1), is_owner INTEGER, disabled INTEGER)", function (err) {
                        if (err !== null) {
                            throw new Error(err);
                        }
                    });
                }
                if (_.indexOf(existingTables, 'groups') === -1) {
                    creatingTables = true;
                    Bot.prototype.log('Creating groups table in auth and adding default group');
                    db.run("CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(25) NOT NULL UNIQUE, power INTEGER DEFAULT(0))", function (err) {
                        if (err !== null) {
                            throw new Error(err);
                        } else {
                            // No errors insert the default group
                            db.serialize(function () {
                                db.run("INSERT INTO groups (name, power) VALUES ('default', 0)", function (err) {
                                    if (err !== null) {
                                        throw new Error(err);
                                    }
                                });
                            });
                        }
                    });
                }
                if (_.indexOf(existingTables, 'command_permissions') === -1) {
                    creatingTables = true;
                    Bot.prototype.log('Creating command_permissions table in auth');
                    db.run("CREATE TABLE IF NOT EXISTS command_permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, command VARCHAR(100) NOT NULL UNIQUE, value INTEGER DEFAULT(0))", function (err) {
                        if (err === null) {
                            d.resolve(err, 'Auth Tables created successfully');
                        } else {
                            throw new Error(err);
                        }
                    });
                }
            });
        });
        if (creatingTables === false) {
            d.resolve('Nothing to do here');
        }
    });

    return d.promise;
};

auth.fetchUsersFromDb = function () {
    var d = when.defer(),
        users = [];
    // Set all calls to be serialized
    db.serialize(function () {
        db.each("SELECT id, account, is_owner AS isOwner, group_id AS groupId FROM users WHERE disabled != '1'", function (err, row) {
            if (err === null) {
                if (row !== undefined) {
                    users.push(new User(row));
                }
            } else {
                Bot.prototype.log('Error: ' + err);
            }
        }, function (err, total) {
            if (err === null) {
                auth.__users = users;
                d.resolve('Auth successfully loaded ' + total + ' users from the database');
                Bot.prototype.log('Auth loaded ' + total + ' users from the database');
            } else {
                throw new Error(err);
            }
        });
    });

    return d.promise;
};

auth.fetchGroupsFromDb = function () {
    var d = when.defer(),
        groups = [];
    // Set all calls to be serialized
    db.serialize(function () {
        db.each("SELECT id, name, power FROM groups", function (err, row) {
            if (err === null) {
                if (row !== undefined) {
                    groups.push(new Group(row));
                }
            } else {
                throw new Error(err);
            }
        }, function (err, total) {
            if (err === null) {
                auth.__groups = groups;
                d.resolve('Auth successfully loaded ' + total + ' groups from the database');
                Bot.prototype.log('Auth loaded ' + total + ' groups from the database');
            } else {
                throw new Error(err);
            }
        });
    });

    return d.promise;
};

auth.fetchCommandPermissionsFromDb = function () {
    var d = when.defer(),
        commands = [];
    db.serialize(function () {
        db.each("SELECT id, command, value FROM command_permissions", function (err, row) {
            if (err === null) {
                if (row !== undefined) {
                    commands.push(new Command(row));
                }
            } else {
                throw new Error(err);
            }
        }, function (err, total) {
            if (err === null) {
                auth.__commands = commands || [];
                d.resolve('Auth successfully loaded ' + total + ' commands from the database');
                Bot.prototype.log('Auth loaded ' + total + ' commands from the database');
            } else {
                throw new Error(err);
            }
        });
    });
    return d.promise;
};

auth.getAccountName = function (client, nick) {
    var d = when.defer();
    client.whois(nick, function (info) {
        if (typeof info === "object") {
            if (info.account !== undefined && info.account.length > 0) {
                d.resolve({err: null, account: info.account});
            } else {
                d.reject({
                    err: true,
                    message: 'User is not registered with the network. They must be registered to be added as a user'
                });
            }
        } else {
            d.reject({err: 'Expected info to be an object', message: 'Failed to lookup account name'});
            throw new Error('Expected info to be an object');
        }
    });
    return d.promise;
};

auth.getUser = function (unknown) {
    // Take an argument of either account name or id to resolve to user object
    var d = when.defer(),
        method,
        user;
    if (typeof unknown === 'number') {
        method = 'id';
    } else {
        method = 'account';
    }
    switch (method) {
    case 'account':
        for (var i = 0, len = auth.__users.length; i < len; i++) {
            if (auth.__users[i].getAccount() === unknown) {
                // Resolve if found
                d.resolve({err: null, user: auth.__users[i]});
                break;
            }
        }
        d.reject({err: true, message: 'Error: No user account found'});
        break;
    case 'id':
        for (var i = 0, len = auth.__users.length; i < len; i++) {
            if (auth.__users[i].getId() === parseInt(unknown)) {
                d.resolve({err: null, user: auth.__users[i]});
                break;
            }
        }
        d.reject({err: true, message: 'Error: No user account found'});
        break;
    default:
        d.resolve({err: true, message: 'You must provide a method for lookup'});
    }

    return d.promise;
};

auth.getAllUsers = function () {
    var users = [];
    _.forEach(auth.__users, function (user, index) {
        users[index] = user;
    });

    return users;
};

// Auth Record Management Functions
auth.createUser = function (account, group) {
    var d = when.defer(),
        group = auth.getGroup(group);
    if (typeof group !== "object") {
        var groupId = 0;
    } else {
        var groupId = group.getId();
    }
    db.serialize(function () {
        db.run("INSERT INTO users (account, group_id, is_owner, disabled) VALUES (?, ?, 0, 0)", [account, groupId], function (err) {
            if (err === null) {
                // Re-fetch all users an new user create so we have a full list.
                // todo: think about doing this a different way
                auth.__users = [];
                auth.fetchUsersFromDb();
                d.resolve({err: null, message: 'User Added Successfully!'});
            } else {
                // If Error assume unique collision and return error
                d.resolve({err: err, message: 'An account with this name already exists'});
            }
        });
    });

    return d.promise;
};

auth.updateUser = function (identifier, options) {
    var d = when.defer(),
        query = 'UPDATE users SET';
    auth.getUser(identifier)
        .then(function (res) {
            if (typeof res.user !== "object") {
                d.reject({err: true, message: 'Not a valid user'});
                return;
            }
            var user = res.user;
            // Options must be an object
            options = options || {};
            // Create a query to run based on items in options argument
            var keys = Object.keys(options),
                i = 0;
            for (var key in keys) {
                var seperator = (i > 0 ? ', ' : '');
                switch (keys[key]) {
                case 'account':
                    query = query + seperator + ' ' + keys[key] + '=?';
                    break;
                case 'isOwner':
                    query = query + seperator + ' is_owner=?';
                    break;
                case 'group':
                    query = query + seperator + ' group_id=?';
                    options[keys[key]] = auth.getGroup(options[keys[key]]).getId();
                    break;
                case 'disabled':
                    query = query + seperator + ' ' + keys[key] + '=?';
                    break;
                default:
                    d.reject({
                        err: true,
                        message: 'Error: options may only contain the following keys: account, isOwner, disabled'
                    });
                    break;
                }
                i++;
            }
            query = query + ' WHERE id = ?';
            // Options are valid, we can now attempt to update the record
            db.serialize(function () {
                db.run(query, _.values(options).concat(user.getId()), function (err) {
                    if (err === null) {
                        for (var key in keys) {
                            if (keys[key] === 'group') {
                                user.setProperty('groupId', options[keys[key]]);
                            } else {
                                user.setProperty(keys[key], options[keys[key]]);
                            }
                        }
                        d.resolve({err: null, message: 'User Updated Successfully!'});
                    } else {
                        d.reject({err: err, message: 'Failed to update user'});
                    }
                });
            });
        }, function (res) {
            d.reject(res);
        });
    return d.promise
};

auth.deleteUser = function (name) {
    var d = when.defer();
    auth.getUser(name).then(function (res) {
        if (typeof res.user !== "object") {
            d.reject({err: true, message: 'Not a valid user'});
            return;
        }
        db.serialize(function () {
            var id = res.user.getId();
            db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
                if (err === null) {
                    auth.__users = [];
                    auth.fetchUsersFromDb();
                    d.resolve({err: null, message: 'User Deleted Successfully!'});
                    delete auth.__users[id];
                } else {
                    d.reject({err: err, message: 'An error occurred while deleting user'});
                }
            });
        });
    }, function (res) {
        d.reject(res);
    });
    return d.promise;
};

auth.getGroup = function (unknown) {
    var method, group;
    if (typeof unknown === "number") {
        method = 'id';
    } else {
        method = 'name';
    }
    switch (method) {
    case 'name':
        for (var i = 0, len = auth.__groups.length; i < len; i++) {
            if (auth.__groups[i].getName() === unknown) {
                // Resolve if found
                return auth.__groups[i];
            }
        }
        return 'Error: No group found';
    case 'id':
        for (var i = 0, len = auth.__groups.length; i < len; i++) {
            if (auth.__groups[i].getId() === parseInt(unknown)) {
                if (auth.__groups[i].getName().length > 1) {
                    // Resolve if found
                    return auth.__groups[i];
                }
            }
        }
        return 'Error: No group found';
    default:
        return 'You must provide a method for lookup';
    }
};

auth.getAllGroups = function () {
    var groups = [];
    _.forEach(auth.__groups, function (group, index) {
        groups[index] = group;
    });

    return groups;
};

auth.createGroup = function (name, power) {
    var d = when.defer();
    db.serialize(function () {
        db.run("INSERT INTO groups (name, power) VALUES(?, ?)", [name, power], function (err) {
            if (err === null) {
                auth.__groups = [];
                auth.fetchGroupsFromDb();
                d.resolve({err: null, message: 'Group added successfully!'});
            } else {
                // If Error assume unique collision and return error
                d.resolve({err: err, message: 'An account with this name already exists'});
            }
        });
    });
    return d.promise
};

auth.updateGroup = function (name, options) {
    var d = when.defer(),
        query = 'UPDATE groups SET',
        group = auth.getGroup(name);
    if (typeof group !== "object") {
        d.reject({err: true, message: 'Not a valid group'});
        return d.promise;
    }
    // Options must be an object
    options = options || {};
    // Create a query to run based on items in options argument
    var keys = Object.keys(options),
        i = 0;
    for (var key in keys) {
        var seperator = (i > 0 ? ', ' : '');
        switch (keys[key]) {
        case 'power':
            query = query + seperator + ' ' + keys[key] + ' = ?';
            break;
        default:
            d.reject({err: true, message: 'Error: options may only contain the following keys: power/value'});
            break;
        }
        i++;
    }
    query = query + ' WHERE id = ?';
    // Options are valid, we can now attempt to update the record
    db.serialize(function () {
        console.log(_.values(options));
        db.run(query, _.values(options).concat(group.getId()), function (err) {
            if (err === null) {
                for (var key in keys) {
                    group.setProperty(keys[key], options[keys[key]]);
                }
                d.resolve({err: null, message: 'Group Updated Successfully!'});
            } else {
                d.reject({err: err, message: 'Failed to update group'});
            }
        });
    });
    return d.promise;
};

auth.deleteGroup = function (name) {
    var d = when.defer(),
        group = auth.getGroup(name);
    if (typeof group !== "object") {
        d.reject({err: true, message: 'group is not an object'});
        return;
    }
    db.serialize(function () {
        db.run("DELETE FROM groups WHERE id = ?", [group.getId()], function (err) {
            if (err === null) {
                d.resolve({err: null, message: 'Group Deleted Successfully!'});
            } else {
                d.reject({err: err, message: 'An error occurred while deleting group'});
            }
        });
    });
    return d.promise;
};

auth.restrictCommand = function (command, value) {
    var d = when.defer();
    db.serialize(function () {
        db.run("INSERT INTO command_permissions (command, value) VALUES(?, ?)", [command, value], function (err) {
            if (err === null) {
                auth.__commands = [];
                auth.fetchCommandPermissionsFromDb();
                d.resolve({err: null, message: 'Command restricted successfully'});
            } else {
                db.serialize(function () {
                    db.run("UPDATE command_permissions SET value = ? WHERE command = ?", [value, command], function (err) {
                        if (err === null) {
                            auth.__commands = [];
                            auth.fetchCommandPermissionsFromDb();
                            d.resolve({err: null, message: 'Command restriction updated successfully'});
                        } else {
                            // If Error assume unique collision and return error
                            d.reject({err: err, message: 'Failed to update restriction'});
                        }
                    });
                });
            }
        });
    });
    return d.promise;
};

auth.unrestrictCommand = function (command) {
    var d = when.defer();

    if (auth.isCommandRegistered(command) === false) {
        d.reject({err: true, message: 'Command not restricted'});
        return d.promise;
    }
    var commandObject = auth.getCommand(command);
    db.serialize(function () {
        db.run("DELETE FROM command_permissions WHERE id = ?", [commandObject.getId()], function (err) {
            if (err === null) {
                auth.__commands = [];
                auth.fetchCommandPermissionsFromDb();
                d.resolve({err: null, message: 'Command Un-Restricted successfully'});
            } else {
                d.reject({err: err, message: 'Failed to Un-Restrict command'});
            }
        });
    });
    return d.promise;
}

module.exports = auth;