import React, { useContext, useEffect, useMemo } from "react";
import { createStore, Molecule, MoleculeScope, ScopeTuple } from "./molecule";
import { createMemoizeAtom } from "./weakCache";

export const STORE_CONTEXT = React.createContext(createStore());
STORE_CONTEXT.displayName = "Jotai Molecule Store Context";

export const SCOPE_CONTEXT = React.createContext<ScopeTuple<unknown>[]>([]);
SCOPE_CONTEXT.displayName = "Jotai Molecule Scope Context";

export const SCOPE_CACHE_CONTEXT = React.createContext<PrimitiveScopeMap>(
  new WeakMap()
);
SCOPE_CACHE_CONTEXT.displayName = "Jotai Molecule Scope Cache Context";

type PrimitiveScopeMap = WeakMap<
  AnyMoleculeScope,
  Map<AnyScopeValue, TupleAndReferences>
>;

type TupleAndReferences = {
  references: Set<Symbol>;
  tuple: AnyScopeTuple;
};

const memoize = createMemoizeAtom();

type AnyMoleculeScope = MoleculeScope<unknown>;
type AnyScopeValue = unknown;
type AnyScopeTuple = ScopeTuple<unknown>;

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

  const id = useMemo(() => Symbol(Math.random()), []);
  const generatedValue = useMemo(
    () => new Error("Do not use this scope value. It is a placeholder only."),
    []
  );
  const value = providedValue ?? generatedValue;
  const primitiveScopeMap = useContext(SCOPE_CACHE_CONTEXT);
  useEffect(() => {
    return () => {
      // Clean up scope value, if cached
      // Deleting the scope tuple should cascade a cleanup
      // 1 - it is deleted from this map
      // 2 - it should be garbage collected from the Molecule store WeakMap
      // 3 - any atoms created in the molecule should be garbage collected
      // 4 - any atom values in the jotai store should be garbage collected from it's WeakMap
      deregisterScopeTuple<T>(primitiveScopeMap, scope, value, id);
    };
  }, [scope, value, primitiveScopeMap, id]);

  /**
   * Memoization is important since the store relies
   * on the ScopeTuple being referentially consistent
   *
   * If a new array is provided to the store,
   * then new molecules are created
   */
  const memoizedTuple = useMemo<ScopeTuple<T>>(
    () =>
      registerMemoizedScopeTuple<T>(scope, value as T, primitiveScopeMap, id),
    [scope, value, primitiveScopeMap, id]
  );
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

function deregisterScopeTuple<T>(
  primitiveScopeMap: PrimitiveScopeMap,
  scope: MoleculeScope<T>,
  value: Error | NonNullable<T>,
  id: Symbol
) {
  const scopeMap = primitiveScopeMap.get(scope);
  if (!scopeMap) return;

  const cached = scopeMap.get(value);
  if (!cached) return;

  cached.references.delete(id);

  if (cached.references.size <= 0) {
    scopeMap.delete(value);
  }
}

export function useMolecule<T>(m: Molecule<T>): T {
  const store = useContext(STORE_CONTEXT);
  const scopes = useContext(SCOPE_CONTEXT);
  return store.get(m, ...scopes);
}

function registerMemoizedScopeTuple<T>(
  scope: MoleculeScope<T>,
  value: T,
  primitiveMap: PrimitiveScopeMap,
  id: Symbol
) {
  console.log("Register", scope, value);
  const tuple: ScopeTuple<T> = [scope, value];
  if (typeof value === "object") {
    // If we have an object, we can safely weak cache it.
    // Equivalent to `cache.get(scope).get(value)`
    return memoize(() => tuple, [scope, value as unknown as object]);
  }

  // Not an object, so we can't safely cache it in a WeakMap
  let valuesForScope = primitiveMap.get(scope);
  if (!valuesForScope) {
    valuesForScope = new Map();
    primitiveMap.set(scope, valuesForScope);
  }

  let cached = valuesForScope.get(value);
  if (cached) {
    // Increment references
    cached.references.add(id);

    return cached.tuple as ScopeTuple<T>;
  }

  const references = new Set<Symbol>();
  references.add(id);
  valuesForScope.set(value, {
    references,
    tuple,
  });

  return tuple;
}
