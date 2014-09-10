var util = require('util');
var fs = require('fs');
var Bot = require('./lib/bot');
var pluginLoader = require('./lib/plugin-loader');
var auth = require('./lib/auth');
var config = requiure('/config.json');

var NodeBot = function (config) {
  // Load the bot
  Bot.call(this, config);

  // Load the plugin loader
  pluginLoader.call(this, config.plugins, Bot);
};

util.inherits(NodeBot, Bot);

NodeBot.prototype.init = function () {
  Bot.prototype.init.call(this);
  pluginLoader.prototype.init.call(this);
  auth.prototype.init.call(this).then(function(res) {
    Bot.prototype.log(res);
  });
};
(new NodeBot(JSON.parse(config))).init();
