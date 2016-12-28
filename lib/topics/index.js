const q = require('q');
function Topics(mediator) {
  this.mediator = mediator;
  this.subscriptions = {};
}

Topics.prototype.prefix = function(prefix) {
  this.prefix = prefix;
  return this;
};

Topics.prototype.entity = function(entity) {
  this.entity = entity;
  return this;
};

Topics.prototype.addSubscription = function(topic, fn) {
  this.subscriptions[topic] = this.mediator.subscribe(topic, fn);
};

Topics.prototype.getTopic = function(topicName, prefix) {
  // create, done => done:wfm:user:create
  var parts = [this.prefix, this.entity, topicName];
  if (prefix) {
    parts.unshift(prefix);
  }
  return parts.join(':');
};

function wrapInMediatorPromise(self, method, fn) {
  return function() {
    q(fn.apply(self, arguments)).then(function(result) {
      var topic = self.getTopic(method, 'done');
      if (typeof result === 'object' && result.id) {
        topic = [topic, result.id].join(':');
      } else if (typeof result === 'string') {
        topic = [topic, result].join(':');
      }
      self.mediator.publish(topic, result);
      return result;
    }).catch(function(error) {
      var topic = self.getTopic(method, 'error');
      if (error && error.id) {
        topic = [topic, error.id].join(':');
      }
      self.mediator.publish(topic, error);
    });
  };
}

Topics.prototype.on = function(method, fn) {
  var topic = this.getTopic(method);
  this.addSubscription(topic, wrapInMediatorPromise(this, method, fn));
  return this;
};

Topics.prototype.onDone = function(method, fn) {
  var topic = this.getTopic(method, 'done');
  this.addSubscription(topic, wrapInMediatorPromise(this, topic, fn));
  return this;
};

Topics.prototype.onError = function(method, fn) {
  var topic = this.getTopic(method, 'error');
  this.addSubscription(topic, wrapInMediatorPromise(this, topic, fn));
  return this;
};

Topics.prototype.unsubscribeAll = function() {
  var subId;
  for (var topic in this.subscriptions) {
    if (this.subscriptions.hasOwnProperty(topic)) {
      subId = this.subscriptions[topic].id;
      this.mediator.remove(topic, subId);
    }
  }
};

Topics.prototype.request = function(topic, params, options) {
  return this.mediator.request(this.getTopic(topic), params, options);
};

module.exports = Topics;