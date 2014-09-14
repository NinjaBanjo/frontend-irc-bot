var fs = require('fs');
var when = require('when');
var Bot = require('../bot');
var pluginsDir = __dirname + '/../../plugins';

var loader = function (scope) {
  this.__plugins = {};
};

loader.prototype.init = function (callback) {

  // Store the plugins config from the global configs in a local
  this.__pluginsConfig = this.__config.plugins;

  loader.prototype.loadPlugins.call(this, loader.prototype.getPlugins(), function () {
    loader.prototype.initPlugins.call(this, loader.prototype.registerPluginCommands);
  });

  // Call the callback when finished
  if (typeof callback == "function") {
    callback.call(this);
  }
};

loader.prototype.initPlugins = function (callback) {
  var keys = Object.keys(this.__plugins);
  for (var i = 0, length = keys.length; i < length; i++) {
    var config = this.__pluginsConfig[keys[i]] || {};
    this.__plugins[keys[ i ]].prototype.init(config, this);
    Bot.prototype.log('Plugin Loaded: ' + keys[i]);
  }
  if(typeof callback === "function") {
    callback.call(this);
  }
};

loader.prototype.registerPluginCommands = function() {
  var keys = Object.keys(this.__plugins);
  for (var i = 0, length = keys.length; i < length; i++) {
    this.__plugins[keys[ i ]].prototype.registerCommands.call(this);
    Bot.prototype.log('Registered Commands for Plugin: ' + keys[i]);
  }
}

loader.prototype.loadPlugins = function (pluginsToLoad, callback) {
  for (var i = 0, len = pluginsToLoad.length; i < len; i++) {
    this.__plugins[pluginsToLoad[i]] = require(pluginsDir + '/' + pluginsToLoad[i]);
  }
  if (typeof callback === "function") {
    callback.call(this);
  }
};

loader.prototype.getPlugins = function () {
  return fs.readdirSync(pluginsDir).filter(function (file) {
    return fs.statSync(pluginsDir + '/' + file).isDirectory();
  });
};

module.exports = loader;