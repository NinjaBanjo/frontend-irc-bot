var User = function (properties) {
  if (typeof properties !== "Object") {
    this.__properties = properties;
  } else {
    throw Error('Properties must be an object');
  }
}

User.prototype.getId = function () {
  return this.__properties.id;
}

User.prototype.getAccount = function () {
  return this.__properties.account;
};

User.prototype.setProperty = function (attribute, newValue) {
  this.__properties[attribute] = newValue;
};

module.exports = User;