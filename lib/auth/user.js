var User = function(properties) {
  if(typeof properties !== "Object") {
    this.__properties = properties;
  } else {
    throw Error('Properties must be an object');
  }
  return User;
}

User.prototype.getId = function() {
  return User.__properties.id;
}

User.prototype.getAccount = function() {
  return User.__properties.account;
};

module.exports = User;