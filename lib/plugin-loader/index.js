"use strict";
var _ = require('lodash'),
    when = require('when'),
    fs = require('fs'),
    pluginsDir = __dirname + '/../../plugins';

var loader = function () {// do nothing
};

loader.prototype.init = function (server) {
    var self = this;
    this.getPlugins()
        .then(function (pluginsToLoad) {
            self._pluginsToLoad = pluginsToLoad;
            self._pluginsConfig = server.getConfig().plugins || {};
            self.load(server);
            return this;
        });
};

loader.prototype.load = function (server) {
    // Load plugins
    for (var i = 0, len = this._pluginsToLoad.length; i < len; i++) {
        var plugin = require(pluginsDir + '/' + this._pluginsToLoad[i]);
        server.addPlugin(this._pluginsToLoad[i], new plugin());
    }
    // Init plugins
    _.forEach(server.getPlugins(), function (plugin, index) {
        plugin.init(server, server.getConfig()[index]);
        console.log('Plugin ' + index + ' Initialized')
    });
};

loader.prototype.getPlugins = function () {
    var d = when.defer();
    fs.readdir(pluginsDir, function (err, plugins) {
        d.resolve(plugins);
    });
    return d.promise;
};

module.exports = loader;