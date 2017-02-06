import HandlerFn from './HandlerFn';
import ISubscription from './ISubscription';
declare class BaseMediator {
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

export default BaseMediator;
