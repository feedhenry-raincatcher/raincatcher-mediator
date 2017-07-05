#!/usr/bin/env node
var mediator = require('../lib/mediator');
var Topics = require('../lib/topics');
var Promise = require('bluebird');
var runs = 10000;
var i;

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
for (i = 0;i < runs; i++) {
  topicPromises.push(createTopicSubscriber(i));
}
Promise.all(topicPromises).then(function() {
  console.timeEnd('topics');
});