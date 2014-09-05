var fs = require('fs');
var pluginsDir = __dirname + '/../../plugins';

var loader = function () {
  this.__plugins = {};
};

loader.prototype.init = function (callback) {
  this.__plugins = {};

  loader.prototype.loadPlugins.call(this, loader.prototype.getPlugins(), function () {
    loader.prototype.initPlugins.call(this);
  });

  // Call the callback when finished
  if (typeof callback == "function") {
    callback.call(this);
  }
};

loader.prototype.initPlugins = function () {
  var keys = Object.keys( this.__plugins );
  for( var i = 0,length = keys.length; i < length; i++ ) {
    this.__plugins[keys[ i ]].prototype.init.call(this);
  }
};

loader.prototype.loadPlugins = function (pluginsToLoad, callback) {
  for (var i = 0, len = pluginsToLoad.length; i < len; i++) {
    this.__plugins[pluginsToLoad[i]] = require(pluginsDir + '/' + pluginsToLoad[i]);
  }
  if (typeof callback == "function") {
    callback.call(this);
  }
};

loader.prototype.getPlugins = function () {
  return fs.readdirSync(pluginsDir).filter(function (file) {
    return fs.statSync(pluginsDir + '/' + file).isDirectory();
  });
};

module.exports = loader;