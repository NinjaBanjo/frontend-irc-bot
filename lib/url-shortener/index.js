var shorturl = require('shorturl');

var urlShortener = function (urlToShorten, callback) {
    shorturl(urlToShorten, 'goo.gl', function (result) {
        if (typeof callback === "function") {
            callback.call(this, result);
        }
    });
};

module.exports = urlShortener;