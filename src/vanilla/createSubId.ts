export function createSubId() {
  return Symbol(
    // This name is only used for display purposes
    // Do NOT replace this `Symbol` with `Symbol.for`
    // it is NOT intended to be global
    `bunshi.scope.sub ${subscriptionIndex++}`,
  );
}
/**
 * The subscriptionIndex provides a unique name to use
 * in debugging.
 *  - It's only for display purposes
 *  - It has to affect on business logic
 *  - So it does not need to be unique
 *  - So it does not need to auto-increment,
 *  - So it does not need to be a number
 */
let subscriptionIndex = 0;
