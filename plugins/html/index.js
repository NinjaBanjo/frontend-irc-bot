var request = require('request');
var Entities = require('html-entities').XmlEntities;
var Bot = require(__dirname + '/../../lib/bot');
var MDN = {
  htmlElementUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/'
};

var entities = new Entities();

var html = function () {
};

html.prototype.init = function (config) {
  html.__config = config;
};

html.prototype.registerCommands = function () {
  Bot.prototype.registerCommand.call(this, 'html', 'html', 'html');
};

html.html = function (client, params, from, to, originalText, message) {
  var args = [client, params, from, to, originalText, message];
  html.getResult.call(this, params, function (client, params, from, to, originalText, message, result) {
    client.say(to, from + ': ' + result);
  }, args);
};

html.getResult = function (query, callback, callbackArgs) {
  var self = this;
  var url = MDN.htmlElementUrl + encodeURIComponent(query) + '$json';
  request({
    url: url,
    json: true
  }, function (error, resp, body) {
    if (!error && resp.statusCode === 200) {
      if (typeof callback === "function") {
        if (body.summary !== undefined) {
          callback.apply(self, callbackArgs.concat(html.scrubResults(body.summary) + '; '));
        } else {
          callback.apply(self, callbackArgs.concat('No results found'));
        }
      }
    } else {
      callback.apply(self, callbackArgs.concat('No Results Found'));
    }
  });
};

html.scrubResults = function(string) {
  return entities.decode(string.replace(/<\/?[a-zA-Z]+>/ig, ''));
}

module.exports = html;