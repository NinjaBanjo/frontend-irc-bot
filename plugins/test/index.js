var test = function(config) {
  console.log(config);
};

test.prototype.init = function(){
  console.log('test initialized');
};

module.exports = test;