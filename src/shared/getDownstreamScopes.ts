import type { ScopeTuple } from "../vanilla/types";

export function getDownstreamScopes(parentScopes: ScopeTuple<unknown>[], nextTuple: ScopeTuple<unknown>) {
  const [scope] = nextTuple;
  const found = parentScopes.findIndex((scopeTuple) => {
    const foundScope = scopeTuple[0];
    return foundScope === scope;
  });

  const downstreamScopes = found >= 0
    ? // Replace inline (when found)
    [
      ...parentScopes.slice(0, found),
      nextTuple,
      ...parentScopes.slice(found + 1),
    ]
    : // Append to the end (when not found)
    [...parentScopes, nextTuple];
  return downstreamScopes;
}
