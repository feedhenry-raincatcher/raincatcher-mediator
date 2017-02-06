interface IRequestOptions {
  /** Override for the unique id */
  uid?: string;
  /** Base topic to subscribe for the result of the request, gets prefixed with 'done:' */
  doneTopic?: string;
  /** Base topic to subscribe for errors on the request, gets prefixed with 'error:' */
  errorTopic?: string;
  /** Time in ms until timeout error, defaults to 2000 */
  timeout?: number;
}
export default IRequestOptions;
