var util = require('util');
var events = require('events');
var irc = require('irc');

var Bot = module.exports = function (config) {
  // Make sure config is the right format
  if (!Array.isArray(config))
    config = [config];
  for (var i = 0, len = config.length; i < len; i++) {
    if (!config[i] || typeof config[i] !== "object") {
      throw new Error("Bot constructor: config[" + i + "] is not an object.");
    }
  }

  this.__config = config;
  this.__client = {};
  this.__listening = [];

  // Command trigger for bot
  this.__trigger = '!';
  this.__commands = {};

  process.on('uncaughtException', function (err) {
    process.stderr.write("\n" + err.stack + "\n\n");
  });
};

Bot.prototype.init = function () {
  this.__client = new irc.Client(this.__config[0].host, this.__config[0].nick, {
    autoRejoin: true,
    floodProtection: true,
    autoConnect: false
  });
  this.__client.addListener('error', function (err) {
    console.log(err);
  });
  Bot.prototype.log.call(this, "Connecting...");
  this.__client.connect(5, Bot.prototype.joinChannels.call(this));
};

Bot.prototype.joinChannels = function () {
  Bot.prototype.log.call(this, 'Joining Channels...');
  this.__client.join(this.__config[0].channels[0], function () {
    Bot.prototype.log('Joined channel');
  });
};

Bot.prototype.log = function (message) {
  console.log(message);
};

Bot.prototype.identify = function () {
  for (var i = 0, len = Bot__config.servers.length; i < len; i++) {
    client.say('nickserv', 'identify ' + Bot.__config.servers[i].password);
  }
};