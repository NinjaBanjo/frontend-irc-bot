"use strict";
var Bot = require('../../lib/bot');
var auth = require('../../lib/auth');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('factoid.sqlite');

var factoid = function () {
    this._network = {};
    this._config = {};
    this._factoids = {};
};

factoid.prototype.init = function (network, config) {
    var self = this;
    this._network = network;
    this._config = config;

    network.addCommand('factoids', this.list, self);
    network.addCommand('set', this.set, self);
    network.addCommand('delete', this.delete, self);
    // Register all commands in db
    // Set serialize on db so all commands get executed in order.
    db.serialize();
    // Create the table if it doesn't exist.
    db.run('CREATE TABLE IF NOT EXISTS factoids (id INTEGER PRIMARY KEY AUTOINCREMENT, network VARCHAR(25) NOT NULL, command TEXT, value TEXT)');
    // Fetch any existing factoids
    db.each("SELECT id, command, value FROM factoids WHERE network= ?", [network.getName()], function (err, row) {
        self._factoids[row.command] = row;
        if (row !== undefined) {
            network.addCommand(row.command, self.factoid, self);
        }
    });
};

factoid.prototype.set = function (network, command, params, from, to) {
    var self = this,
        paramsSplit = params.trim().split(/ (.+)/),
        newCommand = paramsSplit[0],
        value = paramsSplit[1];
    db.get("SELECT id FROM factoids WHERE network = ? AND command = ?", [network.getName(), newCommand], function (err, row) {
        if (row === undefined) {
            db.run("INSERT INTO factoids (network, command, value) VALUES (?, ?, ?)", [network.getName(), newCommand, value]);
            network.addCommand(newCommand, self.factoid);
            network.getClient().notice(from, "Command Inserted Successfully!");
        } else {
            db.run("UPDATE factoids SET value = ? WHERE id = ?", [value, row.id]);
            network.getClient().notice(from, "Command Updated Successfully!");
        }
    });
};

factoid.prototype.delete = function (network, command, params, from, to) {
    db.get("SELECT id FROM factoids WHERE network = ? AND command = ? LIMIT 1", [network.getName(), params], function (err, row) {
        if (row !== undefined) {
            db.run("DELETE FROM factoids WHERE id = ?", [row.id]);
            network.deleteCommand(network.getCommandByName(params));
            network.getClient().notice(from, "Command deleted successfully");
        } else {
            network.getClient().notice(from, "Command does not exist, could not delete");
        }
    });
};

factoid.prototype.list = function (network, command, params, from, to) {
    var factoids = '',
        i = 1;
    db.each("SELECT command FROM factoids ORDER BY command ASC", function (err, row) {
        if (row !== undefined) {
            if (i === 1) {
                factoids = row.command;
            } else {
                factoids += ', ' + row.command;
            }
            i++;
        }
    }, function (err, total) {
        if (total === 0) {
            network.getClient().notice(from, "There are currently no registered factoids");
        } else {
            network.getClient().notice(from, total + " Factoids: " + factoids);
        }
    });
};

factoid.prototype.factoid = function (network, command, params, from, to) {
    // Get command from db and return value to user
    db.get("SELECT command,value FROM factoids WHERE network = ? AND command = ? LIMIT 1", [network.getName(), command], function (err, row) {
        if (row !== undefined) {
            network.getClient().say(to, from + ': ' + row.value);
        } else {
            Bot.prototype.log('Error: factoid not found ' + command);
        }
    });
};

module.exports = factoid;