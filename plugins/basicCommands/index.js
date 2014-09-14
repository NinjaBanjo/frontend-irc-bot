"use strict";
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
    Bot.prototype.registerCommand.call(this, 'down', 'basicCommands', 'down');
};

// Simple LMGTFY link
basicCommands.google = function (client, command, params, from, to, originalText, message) {
    urlShortener('http://lmgtfy.com/?q=' + encodeURIComponent(params), function (shortUrl) {
        client.say(to, from + ': ' + shortUrl);
    });
};

// Simple caniuse search
basicCommands.caniuse = function (client, command, params, from, to) {
    urlShortener('http://caniuse.com/#search=' + encodeURIComponent(params), function (shortUrl) {
        client.say(to, from + ': ' + shortUrl);
    });
};

// Down for everyone or just me
basicCommands.down = function (client, command, params, from, to) {
    urlShortener('http://www.downforeveryoneorjustme.com/' + encodeURIComponent(params), function (shortUrl) {
        client.say(to, from + ': ' + shortUrl);
    });
};

module.exports = basicCommands;