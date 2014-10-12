"use strict";
var util = require('util');
var Bot = require('./lib/bot');
var pluginLoader = require('./lib/plugin-loader');
var auth = require('./lib/auth');
var config = require('./config.json');

var NodeBot = function (config) {
    // Set the working directory so we can use to allow to bot to update itself
    this.workingDirectory = __dirname;
    // Load the bot
    Bot.call(this, config);
    // Load the plugin loader
    pluginLoader.call(this, config.plugins, Bot);
};

util.inherits(NodeBot, Bot);

NodeBot.prototype.init = function () {
    Bot.prototype.init.call(this, auth);
    pluginLoader.prototype.init.call(this);
    auth.init.call(this).then(function (res) {
        Bot.prototype.log(res);
    });

};
(new NodeBot(config)).init();