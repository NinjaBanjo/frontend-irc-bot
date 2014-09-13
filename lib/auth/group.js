var Group = function (properties) {
  if (typeof properties !== "Object") {
    this.__properties = properties;
  } else {
    throw Error('Properties must be an object');
  }
}

this.getId = function () {
  return this.__properties.id;
}

this.getName = function () {
  return this.__properties.name;
};

this.getPower = function(){
  return this.__properties.power
}

this.setPower = function(newValue) {
  this.__properties.power = newValue;
};

module.exports = Group;