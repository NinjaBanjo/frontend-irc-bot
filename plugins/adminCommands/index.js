var Bot = require('../../lib/bot');
var pluginLoader = require('../../lib/plugin-loader');
var auth = require('../../lib/auth');

var adminCommands = function () {
};

adminCommands.prototype.init = function (config, scope) {
  adminCommands.__scope = scope;
  adminCommands.__config = config;
};

adminCommands.prototype.registerCommands = function () {
  Bot.prototype.registerCommand.call(this, 'restart', 'adminCommands', 'restart');
  Bot.prototype.registerCommand.call(this, 'reload', 'adminCommands', 'reloadPlugins');
};

adminCommands.reloadPlugins = function (client, command, params, from, to) {
  client.whois(from, function (res) {
    if (res !== undefined && res.account !== undefined && res.account === 'NinjaBanjo' || res.account === 'jedimind') {
      adminCommands.__scope.plugins = [];
      adminCommands.__scope.commands = {};
      pluginLoader.prototype.init.call(adminCommands.__scope);
    } else {
      client.notice(from, 'You are not authorized to use that command');
      Bot.prototype.log('Unauthorized attempt to use `reload by ' + to);
    }
  });
};

adminCommands.restart = function (client, command, params, from, to) {
  client.whois(from, function (res) {
    if (res !== undefined && res.account !== undefined && res.account === 'NinjaBanjo' || res.account === 'jedimind') {
      // Because the bot is meant to be run with forever by exiting the process forever will restart the bot for us
      process.exit(0);
    } else {
      client.notice(from, 'You are not authorized to use that command');
      Bot.prototype.log('Unauthorized attempt to use `restart by ' + to);
    }
  });
}

module.exports = adminCommands;