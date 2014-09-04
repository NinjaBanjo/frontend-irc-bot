var util = require('util');
var events = require('events');

var NodeBot = function(config){
    this.setTrigger('`');
};

util.inherits(NodeBot, Bot);

var config = require('./config.js');

(new NodeBot(config)).init();
