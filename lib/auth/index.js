var Bot = require('../bot');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('auth.sqlite');
var User = require('./user.js');
var Group = require('./group.js');
var when = require('when');

var auth = function () {
};

auth.prototype.init = function () {
  var d = when.defer();
  // Store application scope reference so we can use it later for auth look ups
  auth.__scope = this;

  auth.prototype.createTables()
    .then(auth.prototype.fetchUsersFromDb)
    .then(auth.prototype.fetchGroupsFromDb)
    .then(function () {
      d.resolve('Auth Initialized');
    });
  return d.promise;
};

auth.authorize = function (client, nick, callback, callbackArgs) {
  var d = when.defer();
  // parts of below may be skipped if we end up storing the users and groups in objects. Trying to keep this async.

  // Will do a whois lookup with the irc client provided and get an account name
  // If account name found, check account name against registered users in db, grabbing rowid to lookup groups against.
  // If matched user found, lookup groups for user against id
  // If groups found for user, return array of groups
  // If no groups found for user, return false
  // If no matched user found, return false;
  // If no account name found, return false.

  return d.promise;
};

auth.prototype.createTables = function () {
  var d = when.defer();
  // Create tables in our db if they don't yet exist. (handles initial setup so we don't need to do it outside of context.
  db.serialize(function () {
    // Create require tables if not exists and on any error, HALT
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, account VARCHAR(16) NOT NULL, group_id, is_owner INTEGER, disabled INTEGER)", function (err) {
      if (err !== null) {
        throw new Error(err);
      }
    });
    db.run("CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(25) NOT NULL UNIQUE, power INTEGER DEFAULT(0))", function (err) {
      if (err === null) {
        d.resolve(err, 'Auth Tables created successfully');
      } else {
        throw new Error(err);
      }
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
    db.each("SELECT users.id, account, is_owner, groups.name FROM users INNER JOIN groups ON users.group_id = groups.id WHERE disabled != '1'", function (err, row) {
      if (err === null) {
        if (row !== undefined) {
          users.push(new User(row));
        }
      } else {
        Bot.prototype.log('Error: ' + err);
      }
    }, function (err, total) {
      if (err === null) {
        auth.__users = users;
        d.resolve('Auth successfully loaded ' + total + ' users from the database');
        Bot.prototype.log('Auth loaded ' + total + ' users from the database');
      } else {
        throw new Error(err);
      }
    });
  });

  return d.promise;
};

auth.prototype.fetchGroupsFromDb = function () {
  var d = when.defer(),
    groups = [];
  // Set all calls to be serialized
  db.serialize(function () {
    db.each("SELECT id, name, power FROM groups", function (err, row) {
      if (err === null) {
        if (row !== undefined) {
          groups.push(new Group(row));
        }
      } else {
        throw new Error(err);
      }
    }, function (err, total) {
      if (err === null) {
        auth.__groups = groups;
        d.resolve('Auth successfully loaded ' + total + ' groups from the database');
        Bot.prototype.log('Auth loaded ' + total + ' groups from the database');
      } else {
        throw new Error(err);
      }
    });
  });

  return d.promise;
};

auth.prototype.getUser = function (method, string) {
  var d = when.defer(),
    user;
  switch (method) {
    case 'account':
      for (u in auth.__users) {
        if (u.account === string) {
          // Resolve if found
          d.resolve(null, u);
          break;
        }
      }
      d.resolve('Error: No user account found');
      break;
    case 'id':
      for (u in auth.__users) {
        if (u.id === string) {
          d.resolve(null, u);
          break;
        }
      }
      d.resolve('Error: No user account found');
      break;
    default:
      d.resolve('You must provide a method for lookup');
  }

  return d.promise;
};

// Auth Record Management Functions
auth.prototype.createUser = function (account, group) {
  var d = when.defer(),
    groupId = auth.getGroup('name', group);

  db.serialize(function () {
    db.run("INSERT INTO users (account, group_id, is_owner, disabled) VALUES ($account, $groupId, 0, 0)", {account: account, groupId: groupId}, function (err) {
      console.log('Create User: ' + err);
      if (err === null) {
        d.resolve(null, 'User Added Successfully!');
      } else {
        throw new Error(err);
      }
    });
  });

  return d.promise;
};

auth.prototype.updateUser = function (name, options) {
  var d = when.derer(),
    query = 'UPDATE user SET';
  // Options must be an object
  options = options || {};
  // Create a query to run based on items in options argument
  var keys = Object.keys(options),
    i = 0;
  for (key in keys) {
    var seperator = (i > 0 ? ', ' : '');
    switch (key) {
      case 'account':
        query = query + seperator + ' ' + key + '="$account"';
        break;
      case 'isOwner':
        query = query + seperator + ' is_owner="$isOwner"';
        break;
      case 'disavled':
        query = query + seperator + ' ' + key + '="$disabled"';
        break;
      default:
        d.resolve('Error: You have not specified any updateable information');
        break;
    }
    i++;
  }
  db.serialize(function () {
    "use strict";
    db.run(query, options, function (err) {
      if (err === null) {
        d.resolve(null, 'User Updated Successfully!');
      } else {
        throw new Error(err);
      }
    });
  });
  return d.promise
};

auth.prototype.deleteUser = function (name) {
  var d = when.derer();

  return d.promise
};

auth.prototype.getGroup = function (method, string) {
  var d = when.defer(),
    group;
  switch (method) {
    case 'name':
      for (g in auth.__groups) {
        if (group.name === string) {
          // Resolve if found
          d.resolve(null, u);
          break;
        }
      }
      d.resolve('Error: No group found');
      break;
    default:
      d.resolve('You must provide a method for lookup');
  }

  return d.promise;
};

auth.prototype.createGroup = function (name, power) {
  var d = when.defer();
  db.serialize(function () {
    "use strict";
    db.run("INSERT INTO groups (name, power) VALUES($name, $power)", {name: name, power: power}, function (err) {
      if (err === null) {
        d.resolve('Group added successfully!');
      } else {
        throw new Error(err);
      }
    });
  });
  return d.promise
};

auth.prototype.updateGroup = function (name, power) {
  var d = when.derer();

  return d.promise
};

auth.prototype.deleteGroup = function (name) {
  var d = when.derer();

  return d.promise
};

auth.prototype.addUserGroup = function (user, groups) {
  var d = when.derer();

  return d.promise
};

auth.prototype.deleteUserGroup = function (user, groups) {
  var d = when.derer();

  return d.promise
};

module.exports = auth;