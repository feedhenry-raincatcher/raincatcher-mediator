declare module 'mediator-js' {
  export class Mediator {
    public once(topic: string, handler: HandlerFn, options?: Object, context?: any): ISubscription
    /**
     * Removes one or all listeners from a topic
     * @param topic The topic from which to remove listeners
     * @param which The identifier for a subscription, can be the handler itself, its unique id or
     *  the entire Subscription object, if not present, will remove all subscriptions from the topic
     */
    public remove(topic: string, which?: string | ISubscription | (() => void)): void
    public publish(topic: string, data?: any, options?: Object): void
    public subscribe(topic: string, handler: HandlerFn): ISubscription
    public subscribeForScope(topic: string, scope: angular.IScope, fn: HandlerFn): ISubscription | void
  }
}

export type HandlerFn = (...params: any[]) => void;

/** Mediator subscription identifier */
export interface ISubscription {
  /** Subscription identifier, used to read/remove a single subscriber from a topic */
  id: string;
}