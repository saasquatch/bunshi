import { ScopeSymbol, TypeSymbol } from "./internal/symbols";

/**
 * A scope that can be used to create scoped molecules.
 *
 * When a molecule depends on a scope, this it becomes a scoped molecule
 * and the molecule will be called to provide a value once per unique scope value.
 *
 */
export type MoleculeScope<T> = {
  defaultValue: T;
  displayName?: string;
} & Record<symbol, unknown>;

/**
 * Create a {@link MoleculeScope}
 *
 * A scope tuple is a combination of both a scope key and a scope value. For example,
 * a scope key would be "User" and the scope value would be "user1@example.com"
 *
 *
 * @typeParam T - the type that this scope provides
 * @param defaultValue
 * @returns a new unique {@link MoleculeScope}
 */
export function createScope<T = undefined>(defaultValue: T): MoleculeScope<T> {
  return {
    defaultValue,
    [TypeSymbol]: ScopeSymbol,
  };
}
