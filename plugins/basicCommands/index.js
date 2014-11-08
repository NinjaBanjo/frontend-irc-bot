"use strict";
var Bot = require('../../lib/bot');
var urlShortener = require('../../lib/url-shortener');

var basicCommands = function () {
};

basicCommands.prototype.init = function (network, config) {
    this.network = network;
    this.__config = config;
    network.addCommand('google', this.google);
    network.addCommand('lmgtfy', this.lmgtfy);
    network.addCommand('lucky', this.lmgtfy);
    network.addCommand('caniuse', this.caniuse);
    network.addCommand('down', this.down);
};

// Simple google link
basicCommands.prototype.google = function (client, command, params, from, to, originalText, message) {
    urlShortener('http://google.com/#q=' + encodeURIComponent(params), function (shortUrl) {
        this.network.getClient().say(to, from + ': ' + shortUrl);
    });
};

// Simple LMGTFY link
basicCommands.prototype.lmgtfy = function (client, command, params, from, to, originalText, message) {
    urlShortener('http://lmgtfy.com/?q=' + encodeURIComponent(params), function (shortUrl) {
        this.network.getClient().say(to, from + ': ' + shortUrl);
    });
};

// Simple caniuse search
basicCommands.prototype.caniuse = function (client, command, params, from, to) {
    urlShortener('http://caniuse.com/#search=' + encodeURIComponent(params), function (shortUrl) {
        this.network.getClient().say(to, from + ': ' + shortUrl);
    });
};

// Down for everyone or just me
basicCommands.prototype.down = function (client, command, params, from, to) {
    urlShortener('http://www.downforeveryoneorjustme.com/' + encodeURIComponent(params), function (shortUrl) {
        this.network.getClient().say(to, from + ': ' + shortUrl);
    });
};

module.exports = basicCommands;