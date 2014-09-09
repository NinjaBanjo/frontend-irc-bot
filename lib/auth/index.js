var Bot = require('../bot');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('auth.sqlite');

var auth = function (scope) {
  this.__scope = scope;
};

auth.prototype.init = function (callback) {
  // do a lookup of all users and groups, and store in object to keep the rest of the application async

  // Call the callback when finished
  if (typeof callback == "function") {
    callback.call(this);
  }
};

auth.authorize = function(client, nick, callback) {
  // parts of below may be skipped if we end up storing the users and groups in objects. Trying to keep this async.

  // Will do a whois lookup with the irc client provided and get an account name
    // If account name found, check account name against registered users in db, grabbing rowid to lookup groups against.
      // If matched user found, lookup groups for user against id
        // If groups found for user, return array of groups
      // If no groups found for user, return false
    // If no matched user found, return false;
  // If no account name found, return false.
};

module.exports = auth;