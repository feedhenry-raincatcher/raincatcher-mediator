import * as Promise from 'bluebird';
import * as _ from 'lodash';
import HandlerFn from './HandlerFn';
import IBaseMediator from './IBaseMediator';
import IRequestOptions from './IRequestOptions';
import ISubscription from './ISubscription';
// tslint:disable-next-line:no-var-requires
const mediatorJs: any = require('mediator-js');

export let Base: { new(): IBaseMediator } = mediatorJs.Mediator;

export default class Mediator extends Base implements IBaseMediator {
  /**
   * A version of {@link once} that returns a Promise
   * @param  {String} channel   Channel identifier to wait on a single message
   * @return {Promise}          A promise that is fulfilled with the next published
   *                             message in the channel
   */
  public promise(channel: string, options?: Object, context?: any): Promise.Thenable<any> {
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
    } else {
      console.log(`Warning: no status topics defined for ${topic}.`)
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

    let returnPromise = new Promise(function(resolve, reject) {
      subs.done = self.once(topics.done, resolve);
      subs.error = self.once(topics.error, reject);
    });
    self.publish.apply(self, args);

    return returnPromise
      .timeout(options.timeout, new Error('Mediator request timeout for topic ' +  topic))
      .finally(function() {
        unsubscribe();
      });
  };
}
