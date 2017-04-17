'use strict';

var _ = require('lodash');
var Mediator = require('mediator-js').Mediator;
var Promise = require('bluebird');

/**
 * A version of {@link once} that returns a Promise
 * @param  {String} channel   Channel identifier to wait on a single message
 * @return {Promise}          A promise that is fulfilled with the next published
 *                             message in the channel
 */
Mediator.prototype.promise = function(channel, options, context) {
  var self = this;
  return new Promise(function(resolve) {
    self.once(channel, resolve, options, context);
  });
};

/**
 * Publishes a message on a topic and wait for a response or error
 *
 * By convention 'return' topics are prefixed with 'done:' and 'error:' to signal
 * the result of the operation, and suffixed with a unique id to map clients in
 * order to supply the results to the correct client.
 *
 * @param  {String} topic      Channel identifier to publish the initial message
 *
 * @param  {Any} parameters    The data to publish to the topic. The unique id used to publish
 *                             the 'return' topic is extracted from this parameter according to
 *                             the following rules:
 *                             - `parameters.id` property, If parameters has this property
 *                             - `parameters[0]` if parameters is an Array
 *                             - `parameters.toString()` otherwise
 *
 * @param  {Object} options    Options object
 * @param  {String} options.uid  Overrides the unique id from the {@link parameters}
 * @param  {String} options.doneTopic  Base topic to subscribe for the result of the request,
 *                               gets prefixed with 'done:'
 * @param  {String} options.errorTopic  Base topic to subscribe for errors on the request,
 *                               gets prefixed with 'error:'
 *
 * @return {Promise}           A Promise that gets fulfilled with the result of the request
 *                               or rejected with the error from the above topics
 */
Mediator.prototype.request = function(topic, parameters, options) {
  var self = this;
  options = options || {};
  var topics = {
    request: topic,
    done: options.doneTopic || 'done:' + topic,
    error: options.errorTopic || 'error:' + topic
  };
  var subs = {};

  var uid = null;
  if (_.has(options, 'uid')) {
    uid = options.uid;
  } else if (typeof parameters !== "undefined" && parameters !== null) {
    if (_.has(parameters, 'id')) {
      uid = parameters.id;
    } else {
      uid = parameters instanceof Array ? parameters[0] : parameters.toString();
    }
  }

  if (uid !== null) {
    topics.done += ':' + uid;
    topics.error += ':' + uid;
  } else {
    console.error('Warning: no status topics defined for ' + topic);
  }

  if (!options.timeout) {
    options.timeout = 60000;
  }

  function unsubscribe() {
    self.remove(topics.done, subs.done.id);
    self.remove(topics.error, subs.error.id);
  }

  var args = [topics.request];
  if (parameters instanceof Array) {
    Array.prototype.push.apply(args, parameters);
  } else {
    args.push(parameters);
  }

  // must setup subscriptions before publish
  var resultPromise = new Promise(function(resolve, reject) {
    subs.done = self.once(topics.done, resolve);
    subs.error = self.once(topics.error, reject);
  });

  self.publish.apply(mediator, args);

  return resultPromise
  .timeout(options.timeout, new Error('Mediator request timeout for topic ' +  topic))
  .finally(function() {
    unsubscribe();
  });
};

// Exposing topics utility
Mediator.prototype.Topics = require("./topics");

var mediator = new Mediator();
mediator.Mediator = Mediator;
module.exports = mediator;
