import { Debug, ScopeSymbol, SortId, TypeSymbol } from "./internal/symbols";
import type { ScopeTuple } from "./types";

/**
 * A scope that can be used to create scoped molecules.
 *
 * When a molecule depends on a scope, this it becomes a scoped molecule
 * and the molecule will be called to provide a value once per unique scope value.
 *
 * Create a {@link MoleculeScope} by calling {@link createScope}
 *
 * ```ts
 * export const UserScope = createScope("user1")
 * ```
 */
export type MoleculeScope<T> = {
  defaultValue: T;
  displayName?: string;
  defaultTuple: ScopeTuple<T>;
} & Record<symbol, unknown>;

/**
 * Create a {@link MoleculeScope}
 *
 * A scope tuple is a combination of both a scope key and a scope value. For example,
 * a scope key would be "User" and the scope value would be "user1@example.com"
 *
 * ```ts
 * export const UserScope = createScope("user1")
 * ```
 *
 * @typeParam T - the type that this scope provides
 * @param defaultValue - the default value for this scope
 * @returns a new unique {@link MoleculeScope}
 */
export function createScope<T = undefined>(
  defaultValue: T,
  options?: { debugLabel?: string },
): MoleculeScope<T> {
  const sortId = debugId++;
  let staticDefaultTupleValue: ScopeTuple<T> | undefined;
  const debugValue = Symbol(options?.debugLabel ?? `bunshi.scope ${sortId}`);
  return {
    defaultValue,
    [TypeSymbol]: ScopeSymbol,
    [Debug]: debugValue,
    [SortId]: sortId,
    get defaultTuple() {
      if (staticDefaultTupleValue) return staticDefaultTupleValue;
      staticDefaultTupleValue = [this, defaultValue];
      return staticDefaultTupleValue;
    },
  };
}

let debugId = 1;
