import { useContext, useEffect, useMemo } from "react";
import { ScopeCacheContext } from "./contexts/ScopeCacheContext";
import { AnyScopeTuple, PrimitiveScopeMap, ScopeTuple } from "./types";
import { createMemoizeAtom } from "./weakCache";

export type TupleAndReferences = {
  references: Set<Symbol>;
  tuple: AnyScopeTuple;
};

const memoize = createMemoizeAtom();

/**
 * Scope tuples need to be memozied as their array to be used in the store.
 *
 * This hook will memoize the tuple in the ScopeCacheContext
 *
 * @returns
 */
export function useMemoizedScopeTuple<T>(tuple?: ScopeTuple<T>): ScopeTuple<T> {
  const id = useMemo(() => Symbol(Math.random()), []);
  const primitiveScopeMap = useContext(ScopeCacheContext);
  const [scope, value] = tuple ?? [];
  useEffect(() => {
    return () => {
      if (!tuple) return;
      // Clean up scope value, if cached
      // Deleting the scope tuple should cascade a cleanup
      // 1 - it is deleted from this map
      // 2 - it should be garbage collected from the Molecule store WeakMap
      // 3 - any atoms created in the molecule should be garbage collected
      // 4 - any atom values in the jotai store should be garbage collected from it's WeakMap
      deregisterScopeTuple<T>(tuple, primitiveScopeMap, id);
    };
  }, [scope, value, primitiveScopeMap, id]);

  /**
   * Memoization is important since the store relies
   * on the ScopeTuple being referentially consistent
   *
   * If a new array is provided to the store,
   * then new molecules are created
   */
  const memoizedTuple = useMemo<ScopeTuple<T>>(() => {
    if (!tuple) return [undefined, undefined] as unknown as ScopeTuple<T>;
    return registerMemoizedScopeTuple<T>(tuple, primitiveScopeMap, id);
  }, [scope, value, primitiveScopeMap, id]);
  return memoizedTuple;
}

/**
 * For values that are "primitive" (not an object),
 * deregisters them from the primitive scope
 * cache to ensure no memory leaks
 */
export function deregisterScopeTuple<T>(
  tuple: ScopeTuple<T>,
  primitiveScopeMap: PrimitiveScopeMap,
  id: Symbol
) {
  const [scope, value] = tuple;
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
export function registerMemoizedScopeTuple<T>(
  tuple: ScopeTuple<T>,
  primitiveMap: PrimitiveScopeMap,
  id: Symbol
): ScopeTuple<T> {
  const [scope, value] = tuple;
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
