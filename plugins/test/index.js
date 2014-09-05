var test = function(config) {
  console.log(config);
};

test.prototype.init = function(){
  console.log('test initialized');

};

test.prototype.test = function(client, perams, from, text, message) {
  console.log('called');
  console.log(arguments);
}

module.exports = test;