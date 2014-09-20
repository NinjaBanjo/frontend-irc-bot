var request = require('request');
var Entities = require('html-entities').XmlEntities;
var MDN = {
    htmlElementUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/'
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
    // If the command is issued without parameters print out usage example.
    if (!params) {
        return client.say(to, from + ': ' + 'Usage: `html <elementName>. Example: `html div');
    }

    // We have to pass the say as a cllabck with available function because the getResult call is synchronise
    html.getResult.call(this, params, function (result) {
        urlShortener(result.url, function (shortUrl) {
            if (result.summary !== undefined) {
                if (result.summary !== undefined && result.summary.length < 300) {
                    var summary = result.summary;
                } else {
                    var summary = result.summary.substr(0, 300) + '... ';
                }

                client.say(to, from + ': ' + summary + shortUrl);
            } else {
                client.say(to, from + ': ' + result);
            }
        });
    });
};

html.getResult = function (query, callback) {
    var self = this;
    var url = MDN.htmlElementUrl + encodeURIComponent(query) + '$json';
    // Make request to MDN
    request({
        url: url,
        json: true
    }, function (error, resp, body) {
        // Check response code
        if (!error && resp.statusCode === 200) {
            // Make sure callback is a function
            if (typeof callback === "function") {
                // If we don't have a summary in the response, assume no usable result
                if (body.summary !== undefined) {
                    callback.call(self, {url: MDN.htmlElementUrl + query, summary: html.scrubResults(body.summary)});
                } else {
                    callback.call(self, 'No results found');
                }
            }
        } else {
            // We didn't get a 200 for response code or another error happen, spit out general error message
            callback.call(self, 'No Results Found');
        }
    });
};

html.scrubResults = function (string) {
    return entities.decode(string.replace(/<\/?[a-z]+([a-z &;,.!?\\="\/-]+)?>/ig, ''));
}

module.exports = html;
