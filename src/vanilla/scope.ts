import { ScopeTuple } from "./types";

export type MoleculeScope<T> = {
  defaultValue: T;
  displayName?: string;
};

export function createScope<T = undefined>(): MoleculeScope<undefined>;
export function createScope<T>(defaultValue: T): MoleculeScope<T>;

export function createScope(defaultValue?: unknown): MoleculeScope<unknown> {
  return {
    defaultValue,
  };
}


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