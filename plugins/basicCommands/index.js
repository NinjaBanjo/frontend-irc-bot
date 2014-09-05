var Bot = require(__dirname + '/../../lib/bot');

var basicCommands = function () {
};

basicCommands.prototype.init = function (config) {
  basicCommands.__config = config;
};

basicCommands.prototype.registerCommands = function () {
  Bot.prototype.registerCommand.call(this, 'google', 'basicCommands', 'google');
  Bot.prototype.registerCommand.call(this, 'caniuse', 'basicCommands', 'caniuse');
};

basicCommands.google = function (client, params, from, to, originalText, message) {
  client.say(to, from + ': ' + 'http://lmgtfy.com/?q=' + encodeURIComponent(params));
};

basicCommands.caniuse = function(client, params, from, to) {
  client.say(to, from + ': ' + 'http://caniuse.com/#search=' + encodeURIComponent(params));
};

module.exports = basicCommands;