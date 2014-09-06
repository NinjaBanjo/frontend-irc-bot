var Bot = require(__dirname + '/../../lib/bot');

var caniuse = function () {
};

caniuse.prototype.init = function (config) {
  caniuse.__config = config;
};

caniuse.prototype.registerCommands = function () {
  Bot.prototype.registerCommand.call(this, 'caniuse', 'caniuse', 'caniuse');
};

caniuse.caniuse = function (client, params, from, to, originalText, message) {
  
};
module.exports = caniuse;