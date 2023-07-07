import { PrimitiveScopeMap, ScopeTuple } from "../../vanilla";
import { memoize } from "../../react/useMemoizedScopeTuple";

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
