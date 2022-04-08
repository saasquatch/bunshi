import React, { useContext, useEffect, useMemo } from "react";
import { createStore, Molecule, MoleculeScope, ScopeTuple } from "./molecule";
import { createMemoizeAtom } from "./weakCache";

export const STORE_CONTEXT = React.createContext(createStore());
STORE_CONTEXT.displayName = "Jotai Molecule Store Context";

export const SCOPE_CONTEXT = React.createContext<ScopeTuple<unknown>[]>([]);
SCOPE_CONTEXT.displayName = "Jotai Molecule Scope Context";

const memoize = createMemoizeAtom();

type AnyMoleculeScope = MoleculeScope<unknown>;
type AnyScopeValue = unknown;
type AnyScopeTuple = ScopeTuple<unknown>;
const primitiveScopeMap = new WeakMap<
  AnyMoleculeScope,
  Map<AnyScopeValue, AnyScopeTuple>
>();

export type ProviderProps<T> = {
  scope: MoleculeScope<T>;
  value?: T;
  /**
   * Will generate a unique value, creating a unique separate scope for this provider
   */
  uniqueValue?: boolean;
  children?: React.ReactNode;
};

/**
 * Provides scope for all molecules lower down in the React component tree.
 *
 * Will continue to provide parent scopes down, and either override a scope value or add a new scope.
 *
 */
export function ScopeProvider<T>(props: ProviderProps<T>) {
  const { value: providedValue, scope, uniqueValue } = props;

  if (typeof providedValue !== "undefined" && uniqueValue)
    throw new Error("Provide one of `value` or `uniqueValue` but not both");

  const generatedValue = useMemo(
    () => new Error("Do not use this scope value. It is a placeholder only."),
    []
  );
  const value = providedValue ?? generatedValue;
  useEffect(() => {
    return () => {
      // Clean up scope value, if cached
      // Deleting the scope tuple should cascade a cleanup
      // 1 - it is deleted from this map
      // 2 - it should be garbage collected from the Molecule store WeakMap
      // 3 - any atoms created in the molecule should be garbage collected
      // 4 - any atom values in the jotai store should be garbage collected from it's WeakMap
      primitiveScopeMap.get(scope)?.delete(value);
    };
  }, [scope, value]);

  /**
   * Memoization is important since the store relies
   * on the ScopeTuple being referentially consistent
   *
   * If a new array is provided to the store,
   * then new molecules are created
   */
  const memoizedTuple = useMemo<ScopeTuple<T>>(() => {
    const tuple: ScopeTuple<T> = [scope, value as T];
    if (typeof value === "object") {
      // If we have an object, we can safely weak cache it.
      return memoize(() => tuple, [scope, value as unknown as object]);
    }
    // Not an object, so we can't safely cache it

    let valuesForScope = primitiveScopeMap.get(scope);
    if (!valuesForScope) {
      valuesForScope = new Map();
      primitiveScopeMap.set(scope, valuesForScope);
    }

    let cached = valuesForScope.get(value);
    if (cached) return cached as ScopeTuple<T>;
    valuesForScope.set(value, tuple);

    return tuple;
  }, [props.scope, props.value]);
  const parentScopes = useContext(SCOPE_CONTEXT);

  const found = parentScopes.findIndex((scopeTuple) => {
    const scope = scopeTuple[0];
    return scope === props.scope;
  });

  const downstreamScopes =
    found >= 0
      ? // Replace inline (when found)
        [
          ...parentScopes.slice(0, found),
          memoizedTuple,
          ...parentScopes.slice(found + 1),
        ]
      : // Append to the end (when not found)
        [...parentScopes, memoizedTuple];
  return (
    <SCOPE_CONTEXT.Provider value={downstreamScopes}>
      {props.children}
    </SCOPE_CONTEXT.Provider>
  );
}

export function useMolecule<T>(m: Molecule<T>): T {
  const store = useContext(STORE_CONTEXT);
  const scopes = useContext(SCOPE_CONTEXT);
  return store.get(m, ...scopes);
}
