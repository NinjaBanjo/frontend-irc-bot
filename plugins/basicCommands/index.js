var basicCommands = function () {

};

basicCommands.prototype.init = function (config) {
  this.__config = config;
};

basicCommands.prototype.google = function(client, params, from, to, originalText, message) {
  client.say(to, from + ': ' + 'http://lmgtfy.com/?q=' + encodeURIComponent(params));
};

module.exports = basicCommands;