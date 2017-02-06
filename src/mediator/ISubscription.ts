/** Mediator subscription identifier */
interface ISubscription {
  /** Subscription identifier, used to read/remove a single subscriber from a topic */
  id: string;
}
export default ISubscription;
