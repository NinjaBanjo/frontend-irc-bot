var User = function (properties) {
  if (typeof properties !== "Object") {
    User.__properties = properties;
  } else {
    throw Error('Properties must be an object');
  }
  return User;
}

User.getId = function () {
  return User.__properties.id;
}

User.getAccount = function () {
  return User.__properties.account;
};

User.setProperty = function (attribute, newValue) {
  User.__properties[attribute] = newValue;
};

module.exports = User;