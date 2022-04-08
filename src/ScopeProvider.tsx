import React, { useContext, useEffect, useMemo } from "react";
import { ScopeTuple } from "./molecule";
import { MoleculeScope } from "./scope";
import { createStore } from "./store";
import { createMemoizeAtom } from "./weakCache";

export const StoreContext = React.createContext(createStore());
StoreContext.displayName = "JotaiMoleculeStoreContext";

export const ScopeContext = React.createContext<ScopeTuple<unknown>[]>([]);
ScopeContext.displayName = "JotaiMoleculeScopeContext";

export const ScopeCacheContext = React.createContext<PrimitiveScopeMap>(
  new WeakMap()
);
ScopeCacheContext.displayName = "JotaiMoleculeScopeCacheContext";

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

  const generatedValue = useMemo(
    () => new Error("Do not use this scope value. It is a placeholder only."),
    []
  );
  const value = providedValue ?? generatedValue;

  const memoizedTuple = useMemoizedScopeTuple<T>(scope, value);
  const parentScopes = useContext(ScopeContext);

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
    <ScopeContext.Provider value={downstreamScopes}>
      {props.children}
    </ScopeContext.Provider>
  );
}

function useMemoizedScopeTuple<T>(
  scope: MoleculeScope<T>,
  value: Error | NonNullable<T>
) {
  const id = useMemo(() => Symbol(Math.random()), []);
  const primitiveScopeMap = useContext(ScopeCacheContext);
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
  return memoizedTuple;
}

/**
 * For values that are "primitive" (not an object),
 * deregisters them from the primitive scope
 * cache to ensure no memory leaks
 */
function deregisterScopeTuple<T>(
  primitiveScopeMap: PrimitiveScopeMap,
  scope: MoleculeScope<T>,
  value: Error | NonNullable<T>,
  id: Symbol
) {
  // No scope cleanup needed for non-primitives
  if (typeof value === "object") return;

  const scopeMap = primitiveScopeMap.get(scope);
  if (!scopeMap) return;

  const cached = scopeMap.get(value);
  if (!cached) return;

  cached.references.delete(id);

  if (cached.references.size <= 0) {
    scopeMap.delete(value);
  }
}

/**
 * Creates a memoized tuple of `[scope,value]`
 *
 * Registers primitive `value`s in the primitive scope cache. This has side-effects
 * and needs to be cleaned up with `deregisterScopeTuple`
 *
 */
function registerMemoizedScopeTuple<T>(
  scope: MoleculeScope<T>,
  value: T,
  primitiveMap: PrimitiveScopeMap,
  id: Symbol
) {
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
