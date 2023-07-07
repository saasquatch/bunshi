import { useContext, useEffect, useMemo } from "react";
import { deregisterScopeTuple, registerMemoizedScopeTuple } from "../shared/memoized-scopes";
import { ScopeTuple } from "../vanilla";
import { ScopeCacheContext } from "./contexts/ScopeCacheContext";


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