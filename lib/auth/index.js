var Bot = require('../bot');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('auth.sqlite');
var User = require('./user.js');
var when = require('when');

var auth = function () {
};

auth.prototype.init = function () {
  var d = when.defer();
  // Store application scope reference so we can use it later for auth look ups
  auth.__scope = this;

  auth.prototype.createTables()
    .then(auth.prototype.fetchUsersFromDb).then(function () {
      d.resolve('Auth Initialized');
    });
  return d.promise;
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

auth.prototype.createTables = function()
{
  var d = when.defer();
  // Create tables in our db if they don't yet exist. (handles initial setup so we don't need to do it outside of context.
  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, account TEXT, is_owner INTEGER, disabled INTEGER)");
    db.run("CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, power INTEGER)");
    db.run("CREATE TABLE IF NOT EXISTS user_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, groupId INTEGER)", function () {
      d.resolve('Auth Tables created successfully');
    });
  });

  return d.promise
}
;

auth.prototype.fetchUsersFromDb = function () {
  var d = when.defer(),
    users = [];
  // Set all calls to be serialized
  db.serialize(function () {
    db.each("SELECT id, account, is_owner FROM users WHERE disabled != '1'", function (err, row) {
      if (row !== undefined) {
        users.push(new User(row));
      }
    }, function (err, total) {
      auth.__users = users;
      Bot.prototype.log('Auth loaded ' + total + ' users from the database');
      d.resolve('Auth successfully loaded ' + total + ' users from the database');
    });
  });

  return d.promise;
};

auth.prototype.getUser = function (method, string) {
  var user;
  switch (method) {
    case 'account':
      console.log('accounts');
      // todo: need to finish block of code here
      break;
  };
  return user;
};

// Auth Record Management Functions
auth.prototype.createUser = function (name, groups, callback) {
  db.serialize(function () {
    db.run("INSERT INTO users (account, is_owner, disabled) VALUES (?, 0, 0)", {1: name}, function (err) {
      var results = 'An unknown error occurred';
      if (err !== null) {
        results = 'User Added Successfully!';
      } else {
        results = 'Error: ' + err;
        // Todo: finish writing code here
      }

      if (typeof callback == "function") {
        callback.call(this, results);
      }
    });
  });
};

auth.prototype.updateUser = function (name, options, callback) {

};

auth.prototype.deleteUser = function (name, callback) {

};

auth.prototype.createGroup = function (name, power, callback) {

};

auth.prototype.updateGroup = function (name, power, callback) {

};

auth.prototype.deleteGroup = function (name, callback) {

};

auth.prototype.addUserGroup = function (user, groups, callback) {

};

auth.prototype.deleteUserGroup = function (user, groups, callback) {

}
module.exports = auth;