#!/usr/bin/env node
var Promise = require('bluebird');
var runs = 10000;
var i;

console.time('no-mediator');
var promisesNoMediator = [];
function createPromise(i) {
  return new Promise(function(resolve) {
    setImmediate(function() {
      resolve({user:"test", id: i});
    });
  });
}
for (i = 0;i < runs; i++) {
  promisesNoMediator.push(createPromise(i));
}
Promise.all(promisesNoMediator).then(function() {
  console.timeEnd('no-mediator');
});
