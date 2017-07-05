#!/usr/bin/env node
var mediator = require('../lib/mediator');
var Promise = require('bluebird');
var runs = 10000;
var i;
mediator.subscribe('wfm:user:read', function(id) {
  mediator.publish('done:wfm:user:read:' + id, {user:"test", id: id});
});

console.time('mediator');
var promises = [];
function createSubscriber(i) {
  return new Promise(function(resolve) {
    mediator.subscribe('done:wfm:user:read:' + i, function(user) {
      //console.log(user.id); // 1
      resolve(user);
    });
  });
}
for (i = 0; i < runs; i++) {
  promises.push(createSubscriber(i));
}

// force async
setImmediate(function() {
  for (i = 0; i < runs; i++) {
    mediator.publish('wfm:user:read', i);
  }
});
Promise.all(promises).then(function() {
  console.timeEnd('mediator');
});