var request = require('request');
var Entities = require('html-entities').XmlEntities;
var Bot = require('../../lib/bot');
var urlShortener = require('../../lib/url-shortener');

var MDN = {
    htmlElementUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/'
};

// Make a new instance of entities
var entities = new Entities();

var html = function () {
};

html.prototype.init = function (config) {
    html.__config = config;
};

html.prototype.registerCommands = function () {
    Bot.prototype.registerCommand.call(this, 'html', 'html', 'html');
};

html.html = function (client, command, params, from, to, originalText, message) {
    if (!params) {
        client.say(to, from + ': ' + 'Usage: `html elementName');
        return;
    }

    // We have to pass the say as a cllabck with available function because the getResult call is synchronise
    var args = [client, params, from, to, originalText, message];

    html.getResult.call(this, params, function (result) {
        urlShortener(result.url, function (shortUrl) {
            if (result.err) {
                client.say(to, from + ': ' + result.summary);
                return;
            }

            if (result.summary && result.summary.length < 200) {
                client.say(to, from + ': ' + result.summary + ' ' + shortUrl);
            } else {
                client.say(to, from + ': ' + result.summary.substr(0, 300) + '… ' + shortUrl);
            }
        });
    }, args);
};

html.getResult = function (query, callback, callbackArgs) {
    var self = this;
    var url = MDN.htmlElementUrl + encodeURIComponent(query);

    request({
        url: url + '$json',
        json: true
    },
    function (error, resp, body) {
        var result = {
            url: url,
            statusCode: resp.statusCode
        };

        if (!error && resp.statusCode === 200) {
            result.summary = html.scrubResults(body.summary);
        } else if (resp.statusCode === 404) {
            result.err = 'Nothing found';
            result.summary = 'I got nothin\'.';
        } else {
            result.err = error;
            result.summary = 'Got an unexpected error.';
        }

        if (typeof callback === "function") {
            callback.call(self, result);
        }
    });
};

html.scrubResults = function (string) {
    return entities.decode(string.replace(/<\/?[a-z]+([a-z &;,.!?\\="\/-]+)?>/ig, ''));
}

module.exports = html;
