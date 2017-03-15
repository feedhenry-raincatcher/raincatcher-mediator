import Topics = require('./index');
import * as Promise from 'bluebird';
import Mediator from '../mediator/mediator';
export interface ITopicHandlerContext {
  prefix: string;
  entity: string;
  topic: string;
  mediator: Mediator;
}
type TopicHandlerFn<T> = (this: ITopicHandlerContext, ...params: any[]) => T | Promise.Thenable<T> | void;
export default TopicHandlerFn;
