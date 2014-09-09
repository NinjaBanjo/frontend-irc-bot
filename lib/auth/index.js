var Bot = require('../bot');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('auth.sqlite');

var auth = function () {
};

auth.prototype.init = function (callback) {
  // Store application scope reference so we can use it later for auth look ups
  auth.__scope = this;

  // Create tables in our db if they don't yet exist. (handles initial setup so we don't need to do it outside of context.
  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, account TEXT, is_owner INTEGER, disabled INTEGER)");
    db.run("CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS user_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, groupId INTEGER)");
  });

  // do a lookup of all users and groups, and store in object to keep the rest of the application async
  auth.prototype.getUsersFromDb.call(this);

  // Call the callback when finished
  if (typeof callback == "function") {
    callback.call(this);
  }
};

auth.authorize = function (client, nick, callback, callbackArgs) {
  // parts of below may be skipped if we end up storing the users and groups in objects. Trying to keep this async.

  // Will do a whois lookup with the irc client provided and get an account name
  // If account name found, check account name against registered users in db, grabbing rowid to lookup groups against.
  // If matched user found, lookup groups for user against id
  // If groups found for user, return array of groups
  // If no groups found for user, return false
  // If no matched user found, return false;
  // If no account name found, return false.
};

auth.prototype.getUsersFromDb = function () {
  var users = {};
  // Set all calls to be serialized
  db.serialize(function () {
    db.each("SELECT id, nick, is_owner FROM users WHERE disabled != '1'", function (err, row) {
      if (row !== undefined) {
        users[row.id] = {id: row.id, nick: row.nick, isOwner: row.is_owner};
      }
    }, function (err, total) {
      auth.__users = users;
      Bot.prototype.log('Auth loaded ' + total + ' users from the database');
    });
  });
};

module.exports = auth;