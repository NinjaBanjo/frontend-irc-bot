var Bot = require('../bot');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('auth.sqlite');
var User = require('./user.js');
var Group = require('./group.js');
var when = require('when');
var _ = require('lodash');

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

auth.authorize = function (command, account) {
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
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, account VARCHAR(16) NOT NULL UNIQUE, group_id, is_owner INTEGER, disabled INTEGER)", function (err) {
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
    db.each("SELECT id, account, is_owner FROM users WHERE disabled != '1'", function (err, row) {
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

auth.prototype.getUser = function (unknown) {
// Take an argument of either account name or id to resolve to user object
  var d = when.defer(),
    method,
    user;
  if (typeof unknown === 'number') {
    method = 'id';
  } else {
    method = 'account';
  }
  switch (method) {
    case 'account':
      for (var i = 0, len = auth.__users.length; i < len; i++) {
        var name = auth.__users[i].getAccount();
        if (name.length > 1) {
          // Resolve if found
          d.resolve({err: null, user: auth.__users[i]});
          break;
        }
      }
      d.reject({err: true, message: 'Error: No user account found'});
      break;
    case 'id':
      for (var i = 0, len = auth.__users.length; i < len; i++) {
        if (auth.__users[i].__properties.account === unknown) {
          d.resolve({err: null, user: auth.users[i]});
          break;
        }
      }
      d.reject({err: true, message: 'Error: No user account found'});
      break;
    default:
      d.resolve({err: true, message: 'You must provide a method for lookup'});
  }

  return d.promise;
};

// Auth Record Management Functions
auth.prototype.createUser = function (account, group) {
  var d = when.defer();
  auth.prototype.getGroup(group)
    .then(function (res) {
      "use strict";
      var groupId = res.group.getId();
      db.serialize(function () {
        db.run("INSERT INTO users (account, group_id, is_owner, disabled) VALUES (?, ?, 0, 0)", [account, groupId], function (err) {
          if (err === null) {
            d.resolve({err: null, message: 'User Added Successfully!'});
          } else {
            // If Error assume unique collision and return error
            d.resolve({err: err, message: 'An account with this name already exists'});
          }
        });
      }, function (res) {
        "use strict";
        d.reject(res);
      });
    }, function (res) {
      "use strict";
      d.reject(res);
    });
  return d.promise;
};

auth.prototype.updateUser = function (identifier, options) {
  var d = when.defer(),
    query = 'UPDATE users SET';
  auth.prototype.getUser(identifier)
    .then(function (res) {
      "use strict";
      if (typeof res.user !== "function") {
        d.reject({err: true, message: 'Not a valid user'});
        return;
      }
      var user = res.user;
      // Options must be an object
      options = options || {};
      console.log(options);
      // Create a query to run based on items in options argument
      var keys = Object.keys(options),
        i = 0;
      for (var key in keys) {
        var seperator = (i > 0 ? ', ' : '');
        switch (keys[key]) {
          case 'account':
            query = query + seperator + ' ' + keys[key] + '=?';
            break;
          case 'isOwner':
            query = query + seperator + ' is_owner=?';
            break;
          case 'disabled':
            query = query + seperator + ' ' + keys[key] + '=?';
            break;
          default:
            d.reject({err: true, message: 'Error: options may only contain the following keys: account, isOwner, disabled'});
            break;
        }
        i++;
      }
      query  = query + ' WHERE id = ?';
      // Options are valid, we can now attempt to update the record
      db.serialize(function () {
        "use strict";
        console.log(_.values(options).concat(user.getId()));
        db.run(query, _.values(options).concat(user.getId()), function (err) {
          console.log(err);
          if (err === null) {
            for (var key in keys) {
              user.setProperty(key, options[key]);
            }
            d.resolve({err: null, message: 'User Updated Successfully!'});
          } else {
            d.reject({err: err, message: 'Failed to update user'});
          }
        });
      });
    }, function (res) {
      "use strict";
      d.reject(res);
    });
  return d.promise
};

auth.prototype.deleteUser = function (name) {
  var d = when.defer();
  auth.prototype.getUser(name).then(function (res) {
    "use strict";
    if (typeof res.user !== "function") {
      d.reject({err: true, message: 'Not a valid user'});
      return;
    }
    db.serialize(function () {
      "use strict";
      var id = res.user.getId();
      db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
        if (err === null) {
          d.resolve({err: null, message: 'User Deleted Successfully!'});
          delete auth.__users[id];
        } else {
          d.reject({err: err, message: 'An error occurred while deleting user'});
        }
      });
    });
  }, function (res) {
    "use strict";

  });
  return d.promise;
};

auth.prototype.getGroup = function (unknown) {
  var d = when.defer(),
    method,
    group;
  if (typeof unknown === "number") {
    method = 'id';
  } else {
    method = 'name';
  }
  switch (method) {
    case 'name':
      for (var i = 0, len = auth.__groups.length; i < len; i++) {
        var name = auth.__groups[i].getName();
        if (name.length > 1) {
          // Resolve if found
          d.resolve({err: null, group: auth.__groups[i]});
          break;
        }
      }
      d.reject('Error: No group found');
      break;
    case 'id':
      for (var i = 0, len = auth.__groups.length; i < len; i++) {
        if (auth.__groups[i].id === string) {
          // Resolve if found
          d.resolve({err: null, group: auth.__groups[i]});
          break;
        }
      }
      d.reject('Error: No group found');
      break;
    default:
      d.reject('You must provide a method for lookup');
  }

  return d.promise;
};

auth.prototype.createGroup = function (name, power) {
  var d = when.defer();
  db.serialize(function () {
    "use strict";
    db.run("INSERT INTO groups (name, power) VALUES(?, ?)", [name, power], function (err) {
      if (err === null) {
        d.resolve({err: null, message: 'Group added successfully!'});
      } else {
        // If Error assume unique collision and return error
        d.resolve({err: err, message: 'An account with this name already exists'});
      }
    });
  });
  return d.promise
};

auth.prototype.updateGroup = function (name, power) {
  var d = when.defer();

  return d.promise
};

auth.prototype.deleteGroup = function (name) {
  var d = when.defer();
  auth.prototype.getGroup(name).then(function (res) {
    "use strict";
    if (typeof res.group !== "function") {
      d.reject({err: true, message: 'group is not an object'});
      return;
    }
    db.serialize(function () {
      "use strict";
      db.run("DELETE FROM groups WHERE id = ?", [res.group.getId()], function (err) {
        if (err === null) {
          d.resolve({err: null, message: 'Group Deleted Successfully!'});
        } else {
          d.reject({err: err, message: 'An error occurred while deleting group'});
        }
      });
    });
  });
  return d.promise
};

auth.prototype.addUserGroup = function (user, groups) {
  var d = when.defer();

  return d.promise
};

auth.prototype.deleteUserGroup = function (user, groups) {
  var d = when.defer();

  return d.promise
};

module.exports = auth;