"use strict";
var Bot = require('../../lib/bot');
var auth = require('../../lib/auth');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('factoid.sqlite');

var factoid = function () {
};

factoid.prototype.init = function (network, config) {
    var self = this;
    this._network = network;
    this._config = config;

    network.addCommand('factoids', this.list);
    network.addCommand('set', this.set);
    network.addCommand('delete', this.delete);
    // Register all commands in db
    db.serialize(function () {
        db.run('CREATE TABLE IF NOT EXISTS factoids (id INTEGER PRIMARY KEY AUTOINCREMENT, command TEXT, value TEXT)');

        db.each("SELECT id, command FROM factoids", function (err, row) {
            network.addCommand(row.command, self.factoid);
        });
    });
};

factoid.prototype.set = function (client, command, params, from, to) {
    var paramsSplit = params.trim().split(/ (.+)/),
        newCommand = paramsSplit[0],
        value = paramsSplit[1];
    db.serialize();
    db.get("SELECT id FROM factoids WHERE command = ?", {1: newCommand}, function (err, row) {
        if (row === undefined) {
            db.run("INSERT INTO factoids (command, value) VALUES (?1, ?2)", {1: newCommand, 2: value});
            this._network.addCommand(newCommand, this.factoid);
            client.notice(from, "Command Inserted Successfully!");
        } else {
            db.run("UPDATE factoids SET value = ?1 WHERE id = ?2", {1: value, 2: row.id});
            client.notice(from, "Command Updated Successfully!");
        }
    });
};

factoid.prototype.delete = function (client, command, params, from, to) {
    db.serialize(function () {
        db.get("SELECT id FROM factoids WHERE command = ? LIMIT 1", {1: params}, function (err, row) {
            if (row !== undefined) {
                db.run("DELETE FROM factoids WHERE id = ?", {1: row.id});
                // todo: implement a way to unregister commands from network object
                client.notice(from, "Command deleted successfully");
            } else {
                client.notice(from, "Command does not exist, could not delete");
            }
        });
    });
};

factoid.prototype.list = function (client, command, params, from, to) {
    var factoids = '',
        i = 1;
    db.serialize(function () {
        db.each("SELECT command FROM factoids ORDER BY command ASC", function (err, row) {
            if (row !== undefined) {
                if (i === 1) {
                    factoids = row.command;
                } else {
                    factoids = factoids + ', ' + row.command;
                }
                i++;
            }
        }, function (err, total) {
            if (total === 0) {
                client.notice(from, "There are currently no registered factoids");
            } else {
                client.notice(from, total + " Factoids: " + factoids);
            }
        });
    });
};

factoid.prototype.factoid = function (client, command, params, from, to) {
    // Get command from db and return value to user
    db.serialize(function () {
        db.get("SELECT command,value FROM factoids WHERE command = ? LIMIT 1", {1: command}, function (err, row) {
            if (row !== undefined) {
                client.say(to, from + ': ' + row.value);
            } else {
                Bot.prototype.log('Error: factoid not found ' + command);
            }
        });
    });
};

module.exports = factoid;