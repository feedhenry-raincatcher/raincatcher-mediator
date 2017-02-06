interface IErrorWithDataId extends Error {
  /** Identifier to use as a suffix on the 'error:' topic */
  id?: string;
}
export default IErrorWithDataId;
