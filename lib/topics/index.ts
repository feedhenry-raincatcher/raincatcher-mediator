import { Mediator, RequestOptions } from '../mediator';
import * as Promise from 'bluebird';
import * as _ from 'lodash';

export default class Topics {
  mediator: Mediator;
  subscriptions: Object;
  prefix: string;
  entity: string;
  
  constructor (mediator: Mediator) {
    this.mediator = mediator;
    this.subscriptions = {};
  }
  
  /**
  * Sets the prefix configuration for this instance, which will be part of the name
  * of the handled topics.
  * @param  {String} prefix
  * @return {Topics}        returns self for chaining
  */
  withPrefix(prefix: string) {
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
  withEntity(entity: string): this {
    this.entity = entity;
    return this;
  };
  
  /**
  * Internal function to add a subscription to the internal collection
  * @param {string}   topic topic id
  * @param {Function} fn    handler for the topic
  */
  addSubscription(topic, fn) {
    this.subscriptions[topic] = this.mediator.subscribe(topic, fn);
  };
  
  /**
  * Builds a topic name out of the configured {@link prefix} and {@link entity}
  * @param  {String} topicName The name of the sub-topic to build
  * @param  {String} prefix    An optional prefix to the final topic, i.e. 'done'
  * @return {String}           The complete topic name,
  *                              i.e. {prefix}:{this.prefix}:{this.entity}:{topicName}
  */
  getTopic(this: Topics, topicName: string, prefix?: string): string {
    // create, done => done:wfm:user:create
    var parts = _.compact([this.prefix, this.entity, topicName]);
    if (prefix) {
      parts.unshift(prefix);
    }
    return parts.join(':');
  };
  
  /**
  * Internal function to wrap a `on` handler in a promise that will publish to the
  * related 'done:' and 'error:' topics
  * @param  {String}   method The base topic to publish results to
  * @param  {Function} fn     Handler to wrap, can return a value or a Promise, will be invoked bound to self
  * @return {Function}        Wrapped handler
  */
  private wrapInMediatorPromise<T>(method: string, fn: (...any) => T): (...any) => Promise<T> {
    const self = this;
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
      return result
    }
    
    function publishError(error) {
      let topic = self.getTopic(method, 'error');
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
  on(method: string, fn: (...any) => any | Promise<any>) {
    var topic = this.getTopic(method);
    this.addSubscription(topic, this.wrapInMediatorPromise(method, fn));
    return this;
  };
  
  /**
  * Setup a handler for a namespaced topic, with the 'done:' prefix
  * @param  {String}   method Topic name inside the namespace
  * @param  {Function} fn     Handler function for the topic
  * @return {Topics}          Returns self for chaining
  */
  onDone(method: string, fn: Function) {
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
  onError(method: string, fn: Function) {
    var topic = this.getTopic(method, 'error');
    this.addSubscription(topic, fn.bind(this));
    return this;
  };
  
  /**
  * Modifies mediator to unsubscribe to all topics configured through this instance
  */
  unsubscribeAll() {
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
  request(topic: string, params?: any, options?: RequestOptions) {
    return this.mediator.request(this.getTopic(topic), params, options);
  };
}