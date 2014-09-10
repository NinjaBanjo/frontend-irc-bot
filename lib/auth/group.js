var Group = function (properties) {
  if (typeof properties !== "Object") {
    this.__properties = properties;
  } else {
    throw Error('Properties must be an object');
  }
  return Group;
}

Group.prototype.getId = function () {
  return Group.__properties.id;
}

Group.prototype.getName = function () {
  return Group.__properties.name;
};

module.exports = Group;