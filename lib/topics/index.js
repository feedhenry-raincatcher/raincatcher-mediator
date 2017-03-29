// TODO Move from Q to bluebird
var q = require('q');
const Promise = require('bluebird');
const _ = require('lodash');
var CONSTANTS = require('../constants');
var shortid = require('shortid');


function Topics(mediator) {
  this.mediator = mediator;
  this.subscriptions = {};
}

/**
 * Sets the prefix configuration for this instance, which will be part of the name
 * of the handled topics.
 * @param  {String} prefix
 * @return {Topics}        returns self for chaining
 */
Topics.prototype.prefix = function(prefix) {
  this.prefix = prefix;
  return this;
};

/**
 * Sets the entity configuration for this instance, which will be part of the name
 * of the handled topics.
 * This property is present as a convenience so it can be accessed by handlers via `this.entity`
 *
 * @param  {String} entity
 * @return {Topics}        returns self for chaining
 */
Topics.prototype.entity = function(entity) {
  this.entity = entity;
  return this;
};

/**
 * Internal function to add a subscription to the internal collection
 * @param {string}   topic topic id
 * @param {Function} fn    handler for the topic
 */
Topics.prototype.addSubscription = function(topic, fn) {
  this.subscriptions[topic] = this.mediator.subscribe(topic, fn);
};

/**
 * Builds a topic name out of the configured {@link prefix} and {@link entity}
 * @param  {String} topicName The name of the sub-topic to build
 * @param  {String} prefix    An optional prefix to the final topic, i.e. 'done'
 * @param  {String} topicUid  An optional unique identifier to append
 * @return {String}           The complete topic name,
 *                              i.e. {prefix}:{this.prefix}:{this.entity}:{topicName}:{topicUid}
 */
Topics.prototype.getTopic = function(topicName, prefix, topicUid) {
  // create, done => done:wfm:user:create
  var parts = _.compact([this.prefix, this.entity, topicName, topicUid]);
  if (prefix) {
    parts.unshift(prefix);
  }
  return parts.join(':');
};

/**
 * Internal function to get Promises for done and error topics.
 *
 * @param doneTopicPromise  - A promise for the done topic.
 * @param errorTopicPromise - A promise for the error topic.
 * @returns {*}
 */
Topics.prototype.getTopicPromises = function getTopicPromises(doneTopicPromise, errorTopicPromise) {
  var deferred = q.defer();

  doneTopicPromise.then(function(createdItem) {
    deferred.resolve(createdItem);
  });

  errorTopicPromise.then(function(error) {
    deferred.reject(error);
  });

  return deferred.promise;
};

/**
 *
 * Internal function to get Promises for done and error topics.
 *
 * @param {Object} config - specific config settings such as timeout (if any)
 * @param {string} topicName   - The name of the topic to generate
 * @returns {Promise} - A promise for the topic.
 */
Topics.prototype.getErrorAndDoneTopicPromises = function getErrorAndDoneTopicPromises(topicName, config, payload) {
  //Creating a unique channel to get the response

  var topicUid = payload.topicUid || shortid.generate();

  var doneTopic = this.getTopic(topicName, CONSTANTS.DONE_PREFIX, topicUid);
  var errorTopic = this.getTopic(topicName, CONSTANTS.ERROR_PREFIX, topicUid);

  var doneTopicPromise = this.mediator.promise(doneTopic);
  var errorTopicPromise = this.mediator.promise(errorTopic);

  var timeoutDefer = q.defer();

  setTimeout(function() {
    timeoutDefer.reject(new Error("Timeout For Topic: " + doneTopic));
  }, config.topicTimeout || CONSTANTS.TOPIC_TIMEOUT);

  //Either one of these promises resolves/rejects or it will time out.
  return q.race([this.getTopicPromises(doneTopicPromise, errorTopicPromise), timeoutDefer.promise]);
};


Topics.prototype.execute = function execute(topicName, config, payload) {
  if (payload) {
    payload.topicUid = payload.topicUid || shortid.generate();
  }
  var promise = this.getErrorAndDoneTopicPromises(topicName, config, payload);
  this.mediator.publish(this.getTopic(topicName), payload);
  return promise;
};

Topics.prototype.handleInMediator = function handleInMediator(topicName, clientMethod, parameters) {
  var workflowListErrorTopic = this.getTopic(topicName, CONSTANTS.ERROR_PREFIX, parameters.topicUid);
  var workflowListDoneTopic = this.getTopic(topicName, CONSTANTS.DONE_PREFIX, parameters.topicUid);

  clientMethod(parameters)
      .then(function(arrayOfWorkflows) {
        clientMethod.mediator.publish(workflowListDoneTopic, arrayOfWorkflows);
      }).catch(function(error) {
    clientMethod.mediator.publish(workflowListErrorTopic, error);
  });

};


/**
 * Internal function to wrap a `on` handler in a promise that will publish to the
 * related 'done:' and 'error:' topics
 * @param  {Topics}   self   The instance, receive as a param to avoid exposing this function
 *                           in the prototype
 * @param  {String}   method The base topic to publish results to
 * @param  {Function} fn     Handler to wrap, can return a value or a Promise, will be invoked bound to self
 * @return {Function}        Wrapped handler
 */
function wrapInMediatorPromise(self, method, fn) {
  function publishDone(result) {
    if (_.isUndefined(result)) {
      return;
    }

    var topic = self.getTopic(method, 'done');
    if (_.has(result, 'id')) {
      topic = [topic, result.id].join(':');
    } else if (typeof result === 'string') {
      topic = [topic, result].join(':');
    }
    self.mediator.publish(topic, result);
    return result;
  }

  function publishError(error) {
    var topic = self.getTopic(method, 'error');
    if (_.has(error, 'id')) {
      topic = [topic, error.id].join(':');
    }
    self.mediator.publish(topic, error);
  }

  return function() {
    return Promise.resolve(fn.apply(self, arguments))
      .then(publishDone)
      .catch(publishError);
  };
}

/**
 * Setup a handler for a namespaced topic, if this handler returns a value or throws an Error,
 * it will get published to 'done' and 'error'-predixed topics as per convention.
 *
 * @param  {String}   method Topic name inside the namespace
 * @param  {Function} fn     Handler that can optionally return a value or a Promise
 *                             that will be treated as the result of a `request`
 * @return {Topics}          Returns self for chaining
 */
Topics.prototype.on = function(method, fn) {
  var topic = this.getTopic(method);
  this.addSubscription(topic, wrapInMediatorPromise(this, method, fn));
  return this;
};

/**
 * Setup a handler for a namespaced topic, with the 'done:' prefix
 * @param  {String}   method Topic name inside the namespace
 * @param  {Function} fn     Handler function for the topic
 * @return {Topics}          Returns self for chaining
 */
Topics.prototype.onDone = function(method, fn) {
  var topic = this.getTopic(method, 'done');
  this.addSubscription(topic, fn.bind(this));
  return this;
};

/**
 * Setup a handler for a namespaced topic, with the 'done:' prefix
 * @param  {String}   method Topic name inside the namespace
 * @param  {Function} fn     Handler function for the topic
 * @return {Topics}          Returns self for chaining
 */
Topics.prototype.onError = function(method, fn) {
  var topic = this.getTopic(method, 'error');
  this.addSubscription(topic, fn.bind(this));
  return this;
};

/**
 * Modifies mediator to unsubscribe to all topics configured through this instance
 */
Topics.prototype.unsubscribeAll = function() {
  var subId;
  for (var topic in this.subscriptions) {
    if (this.subscriptions.hasOwnProperty(topic)) {
      subId = this.subscriptions[topic].id;
      this.mediator.remove(topic, subId);
    }
  }
};

/**
 * Does a {@link Mediator.request} in the context of the namespaced topics
 * @param  {String} topic   Base topic inside the configured namespace
 * @param  {Any} params     Data for the `request`
 * @param  {Object} options Options for the `request`
 * @return {Promise}        The result of the `request`
 */
Topics.prototype.request = function(topic, params, options) {
  return this.mediator.request(this.getTopic(topic), params, options);
};

module.exports = Topics;