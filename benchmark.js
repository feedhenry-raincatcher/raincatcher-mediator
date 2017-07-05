var mediator = require('./lib/mediator');
var Topics = require('./lib/topics');
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
for(i=0;i<runs;i++) {
  promises.push(createSubscriber(i));
}

// force async
setImmediate(function() {
  for(i=0;i<runs;i++) {
    mediator.publish('wfm:user:read', i);
  }
});
Promise.all(promises).then(function() {
  console.timeEnd('mediator');
});



console.time('topics');
var topics = new Topics(mediator)
  .prefix('topics')
  .entity('test')
  .on('read', function(id) {
    return {id: id, name: 'test' + id};
  });
var topicPromises = [];
function createTopicSubscriber(i) {
  return topics.request('read', i);
}
for(i=0;i<runs;i++) {
  topicPromises.push(createTopicSubscriber(i));
}
Promise.all(topicPromises).then(function() {
  console.timeEnd('topics');
});



console.time('no-mediator');
var promisesNoMediator = [];
function createPromise(i) {
  return new Promise(function(resolve) {
    setImmediate(function() {
      resolve({user:"test", id: i});
    });
  });
}
for(i=0;i<runs;i++) {
  promisesNoMediator.push(createPromise(i));
}
Promise.all(promisesNoMediator).then(function() {
  console.timeEnd('no-mediator');
});
