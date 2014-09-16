var request = require('request');
var Entities = require('html-entities').XmlEntities;
var MDN = {
    //htmlElementUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/'
    htmlElementUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array'
};
var Bot = require('../../lib/bot');
var urlShortener = require('../../lib/url-shortener');

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
    // We have to pass the say as a cllabck with available function because the getResult call is synchronise
    var args = [client, params, from, to, originalText, message];

    html.getResult.call(this, params, function (result) {
        urlShortener(result.url, function (shortUrl) {
            //client.say(to, 'DEBUG: ' + result.url);

            if (result.err) {
                client.say(to, from + ': ' + result.summary + '(' + result.statusCode + ')');
                return;
            }

            if (result.summary && result.summary.length < 200) {
                client.say(to, from + ': ' + result.summary);
            } else {
                client.say(to, from + ': ' + result.summary.substr(0, 300) + '…');
            }
        });
    }, args);
};

html.getResult = function (query, callback, callbackArgs) {
    var self = this;
    //var url = MDN.htmlElementUrl + encodeURIComponent(query) + '$json';
    var url = MDN.htmlElementUrl + '$json';

    request({
        url: url,
        json: true
    }, function (error, resp, body) {
        var result = {
            url: url,
            statusCode: resp.statusCode
        };

        if (!error && resp.statusCode === 200) {
            if (body.summary) {
                result.summary = html.scrubResults(body.summary);
            } else {
                result.summary = 'No results found';
            }
        } else {
            result.err = error;
            result.summary = 'Error';
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
