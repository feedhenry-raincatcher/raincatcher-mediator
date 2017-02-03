import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as mediatorJs from 'mediator-js';

export declare class Base {
  public once(topic: string, handler: HandlerFn, options?: Object, context?: any): ISubscription
  /**
   * Removes one or all listeners from a topic
   * @param topic The topic from which to remove listeners
   * @param which The identifier for a subscription, can be the handler itself, its unique id or
   *  the entire Subscription object, if not present, will remove all subscriptions from the topic
   */
  public remove(topic: string, which?: string | ISubscription | (() => void))
  public publish(topic: string, data?: any, options?: Object)
  public subscribe(topic: string, handler: HandlerFn): ISubscription
  public subscribeForScope(topic: string, scope: angular.IScope, fn: HandlerFn)
}

export let BaseMediator: typeof Base = mediatorJs.Mediator;

export type HandlerFn = (...params: any[]) => void;

/** Mediator subscription identifier */
export interface ISubscription {
  /** Subscription identifier, used to read/remove a single subscriber from a topic */
  id: string;
}

export interface IRequestOptions {
  /** Override for the unique id */
  uid?: string;
  /** Base topic to subscribe for the result of the request, gets prefixed with 'done:' */
  doneTopic?: string;
  /** Base topic to subscribe for errors on the request, gets prefixed with 'error:' */
  errorTopic?: string;
  /** Time in ms until timeout error, defaults to 2000 */
  timeout?: number;
}

export class Mediator extends Base {
  /**
   * A version of {@link once} that returns a Promise
   * @param  {String} channel   Channel identifier to wait on a single message
   * @return {Promise}          A promise that is fulfilled with the next published
   *                             message in the channel
   */
  public promise(channel: string, options?: Object, context?: any) {
    let self = this;
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
   * @return {Promise}           A Promise that gets fulfilled with the result of the request
   *                               or rejected with the error from the above topics
   */
  public request(topic: string, parameters?, options: IRequestOptions = {}): Promise.Thenable<any> {
    const self = this;
    const topics = {
      done: options.doneTopic || 'done:' + topic,
      error: options.errorTopic || 'error:' + topic,
      request: topic
    };
    const subs: {done?: {id: string}, error?: {id: string}} = {};

    let uid = null;
    if (_.has(options, 'uid')) {
      uid = options.uid;
    } else if (typeof parameters !== 'undefined' && parameters !== null) {
      if (_.has(parameters, 'id')) {
        uid = parameters.id;
      } else {
        uid = parameters instanceof Array ? parameters[0] : parameters.toString();
      }
    }

    if (uid !== null) {
      topics.done += ':' + uid;
      topics.error += ':' + uid;
    }

    if (!options.timeout) {
      options.timeout = 2000;
    }

    function unsubscribe() {
      self.remove(topics.done, subs.done.id);
      self.remove(topics.error, subs.error.id);
    }

    let args = [topics.request];
    if (parameters instanceof Array) {
      Array.prototype.push.apply(args, parameters);
    } else {
      args.push(parameters);
    }
    self.publish.apply(mediator, args);

    return new Promise(function(resolve, reject) {
      subs.done = self.once(topics.done, resolve);
      subs.error = mediator.once(topics.error, reject);
    })
    .timeout(options.timeout, new Error('Mediator request timeout for topic ' +  topic))
    .tap(unsubscribe)
    .catch(function(e) {
      unsubscribe();
      // still forward the rejection to clients
      throw e;
    });
  };
}

let mediator = new Mediator();
export default mediator;
