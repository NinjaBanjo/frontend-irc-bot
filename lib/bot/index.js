var util = require('util');
var events = require('events');
var irc = require('irc');

var Bot = module.exports = function (config) {
  // Make sure config is the right format
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
  var self = this;
  this.__client = new irc.Client(this.__config.servers[0].host, this.__config.servers[0].nick, {
    autoRejoin: true,
    floodProtection: true,
    autoConnect: false
  });
  this.__client.addListener('registered', function () {
    Bot.prototype.identify.call(self);
    Bot.prototype.joinChannels.call(self);
  });
  this.__client.addListener('error', function (err) {
    console.log(err);
  });
  this.__client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
  });
  this.__client.addListener('pm', function (from, message) {
    console.log(from + ' => ME: ' + message);
  });
  Bot.prototype.log.call(this, "Connecting...");
  //this.__client.connect(5);
};

Bot.prototype.joinChannels = function () {
  Bot.prototype.log.call(this, 'Joining Channels...');
  for (var i = 0, len = this.__config.servers[0].channels.length; i < len; i++) {
    this.__client.join(this.__config.servers[0].channels[0], function () {
      Bot.prototype.log('Channel Joined');
    });
  }
};

Bot.prototype.identify = function () {
  Bot.prototype.log('Authenticating...');
  this.__client.say('nickserv', 'identify ' + this.__config.servers[0].password);
};


Bot.prototype.log = function (message) {
  console.log(message);
};