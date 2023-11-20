import { AnyMoleculeScope, AnyScopeTuple } from "./internal/internal-types";
import { CleanupCallback } from "./lifecycle";
import { ScopeTuple } from "./types";

type ScopeCleanups = Set<CleanupCallback>;

/**
 * What is stored in the {@link ScopeCache}
 */
type ScopeCacheValue = {
  references: Set<Symbol>;
  tuple: AnyScopeTuple;
  cleanups: ScopeCleanups;
};

/**
 * Key = Scope value
 * Value = cached stuff
 */
type ScopeValueMap = Map<unknown, ScopeCacheValue>;

export function createScoper() {
  const scopeCache = new WeakMap<AnyMoleculeScope, ScopeValueMap>();

  const subscriptionIdToTuples = new WeakMap<Symbol, Set<AnyScopeTuple>>();

  /**
   * A weakset that makes sure that we never call a cleanup
   * function for a molecule more than once.
   *
   * You can think of this as a Map<CleanupCallback, boolean>
   * where we set the value to "true" once the callback has
   * been run:
   *
   * `hasBeenRun.set(callback, true)`
   *
   * Another way is to think of every callback having an
   * `hasBeenRun` property:
   *
   * `callback.hasBeenRun = true`.
   *
   * The weakset provides a simpler, mutation free and memory
   * efficient way to signal that the callback has been run
   * and need not be run again.
   *
   * Without this weakset, we would need more coordination to ensure
   * a callback is only run once.
   */
  const cleanupsRun = new WeakSet<CleanupCallback>();

  function leaseScopes<T>(
    tuples: ScopeTuple<T>[],
    subscriptionId: Symbol
  ): ScopeTuple<T>[] {
    return tuples.map((t) => leaseScope(t, subscriptionId));
  }

  /**
   * Creates a memoized tuple of `[scope,value]`
   *
   * Registers primitive `value`s in the primitive scope cache. This has side-effects
   * and needs to be cleaned up with `deregisterScopeTuple`
   *
   */
  function leaseScope<T>(
    tuple: ScopeTuple<T>,
    subscriptionId: Symbol
  ): ScopeTuple<T> {
    const [scope, value] = tuple;

    // Not an object, so we can't safely cache it in a WeakMap
    let valuesForScope = scopeCache.get(scope);
    if (!valuesForScope) {
      valuesForScope = new Map();
      scopeCache.set(scope, valuesForScope);
    }

    let cached = valuesForScope.get(value);
    if (cached) {
      // Increment references
      cached.references.add(subscriptionId);
      trackSubcription(subscriptionId, cached.tuple as ScopeTuple<T>);
      return cached.tuple as ScopeTuple<T>;
    }

    const references = new Set<Symbol>();
    references.add(subscriptionId);
    valuesForScope.set(value, {
      references,
      tuple,
      cleanups: new Set(),
    });

    trackSubcription(subscriptionId, tuple);

    return tuple;
  }

  function trackSubcription(subscriptionId: Symbol, tuple: AnyScopeTuple) {
    let subscriptionSet = subscriptionIdToTuples.get(subscriptionId);
    if (!subscriptionSet) {
      subscriptionSet = new Set();
      subscriptionIdToTuples.set(subscriptionId, subscriptionSet);
    }
    subscriptionSet.add(tuple);
  }

  /**
   * For values that are "primitive" (not an object),
   * deregisters them from the primitive scope
   * cache to ensure no memory leaks
   */
  function unleaseScope<T>(subscriptionId: Symbol) {
    const tuples = subscriptionIdToTuples.get(subscriptionId);
    if (!tuples) return;
    tuples.forEach(([scope, value]) => {
      const scopeMap = scopeCache.get(scope);
      const cached = scopeMap?.get(value);

      const references = cached?.references;
      references?.delete(subscriptionId);

      if (references && references.size <= 0) {
        scopeMap?.delete(value);

        // Run all cleanups
        cached?.cleanups.forEach((cb) => {
          if (!cleanupsRun.has(cb)) {
            // Only runs cleanups that haven't already been run
            cb();
            cleanupsRun.add(cb);
          }
        });
      }
    });
  }

  function registerCleanups(
    scopeKeys: AnyScopeTuple[],
    cleanupSet: Set<CleanupCallback>
  ) {
    scopeKeys.forEach(([scopeKey, scopeValue]) => {
      cleanupSet.forEach((cleanup) => {
        scopeCache.get(scopeKey)?.get(scopeValue)?.cleanups.add(cleanup);
      });
    });
  }

  return {
    registerCleanups,
    leaseScope,
    leaseScopes,
    trackSubcription,
    unleaseScope,
  };
}
