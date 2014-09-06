var Bot = require('../../lib/bot');
var urlShortener = require('../../lib/url-shortener');

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
  urlShortener('http://lmgtfy.com/?q=' + encodeURIComponent(params), function(shortUrl){
    client.say(to, from + ': ' + shortUrl);
  });
};

basicCommands.caniuse = function(client, params, from, to) {
  urlShortener('http://caniuse.com/#search=' + encodeURIComponent(params), function(shortUrl){
    client.say(to, from + ': ' + shortUrl);
  });
};

module.exports = basicCommands;