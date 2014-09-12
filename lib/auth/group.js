var Group = function (properties) {
  if (typeof properties !== "Object") {
    Group.__properties = properties;
  } else {
    throw Error('Properties must be an object');
  }
  return Group;
}

Group.getId = function () {
  return Group.__properties.id;
}

Group.getName = function () {
  return Group.__properties.name;
};

Group.getPower = function(){
  return Group.__properties.power
}

Group.setPower = function(newValue) {
  Group.__properties.power = newValue;
};

module.exports = Group;