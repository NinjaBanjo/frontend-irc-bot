var Bot = require('../bot');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('auth.sqlite');

var auth = function (scope) {
  this.__scope = scope;
};

auth.prototype.init = function (callback) {


  // Call the callback when finished
  if (typeof callback == "function") {
    callback.call(this);
  }
};

module.exports = auth;