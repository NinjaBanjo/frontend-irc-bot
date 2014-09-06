var util = require('util');
var fs = require('fs');
var Bot = require('./lib/bot');
var pluginLoader = require('./lib/plugin-loader');
var configFile = __dirname + '/config.json';

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
};

// Variable to store our config file
var config;

// Load config from file and store it in our variable
fs.readFile(configFile, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  // Initialize the bot and pass it our config
  (new NodeBot(JSON.parse(data))).init();
});
