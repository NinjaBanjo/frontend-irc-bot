var Group = function (properties) {
    if (typeof properties !== "Object") {
        this.__properties = properties;
    } else {
        throw new Error('Properties must be an object');
    }
}

Group.prototype.getId = function () {
    return this.__properties.id;
}

Group.prototype.getName = function () {
    return this.__properties.name;
};

Group.prototype.getPower = function () {
    return this.__properties.power;
}

Group.prototype.setProperty = function (property, newValue) {
    this.__properties[property] = newValue;
};

module.exports = Group;