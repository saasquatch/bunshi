import type { MoleculeInjector } from ".";
import { createSubId } from "./createSubId";
import type {
  AnyMoleculeScope,
  AnyScopeTuple,
} from "./internal/internal-types";
import type { CleanupCallback } from "./lifecycle";
import type { ScopeTuple } from "./types";

type MaybeWeakMap<K, V> = K extends {} ? WeakMap<K, V> : Map<K, V>;

/**
 * The scoper is not aware of molecules, but keeps track of scopes
 *
 *  - it provides referentially-equal scope tuples for use in other weak maps
 *  - it tracks subscriptions, and runs cleanups when nothing is subscribing anymore
 *  - it keeps track of unmount functions and only ever runs them once
 *
 * Since the scoper uses `Map` and `Set` instead of `WeakMap` and `WeakSet` it
 * is the most likely destination for memory leaks, likely due to scopes not being
 * released.
 *
 */
export function createScoper() {
  /**
   * This scope cache is the key state of this scoper.
   *
   * It is a 2-lever map
   *
   *      Scope
   *       / \
   *         Scope Values
   *            /  \
   *                o
   *                - List of subscriptions (references)
   *                - Memoized tuple, for use as a key in other caches and WeakMaps
   *                - Cleanups for when this scope/value pair is released
   *
   *
   */
  const scopeCache = new WeakMap<
    /**
     * All scopes are objects, so they can be used as a WeakMap key
     * If scopes are created temporarily, this will automatically be cleaned up
     * from this WeakMap
     */
    AnyMoleculeScope,
    /**
     * Ideally we would prefer to use a WeakMap here instead of a Map, but
     * since scope values can be primitives, they aren't allowed as a
     * key in a WeakMap.
     */
    MaybeWeakMap<
      /**
       * The scope value, which should match the type of the MoleculeScope
       */
      unknown,
      /**
       * The point of the cache is to store this object
       * of things related to a scope value
       */
      {
        /**
         * The set of subscription IDs that are using this scope value
         */
        references: Set<Symbol>;
        /**
         * A referentially-stable array (i.e. Tuple) for the scope value.
         *
         * This is used as a key in other places in WeakMap and WeakSet
         */
        tuple: AnyScopeTuple;
        /**
         * These callbacks should be called when there are no more subscriptions
         */
        cleanups: Set<CleanupCallback>;
      }
    >
  >();

  /**
   * The ideally structure that we want is actualy a "multimap" between
   * scopes and subscription.
   *
   *  - from a scope, find it's subscriptions
   *  - from a subscription, find it's scopes
   *
   */
  const subscriptionIdToTuples = new WeakMap<
    /**
     * A subscription ID
     */
    Symbol,
    /**
     * The set of scopes that are leased by this subscription
     *
     * Ideally we'd like to use a WeakSet here, but weaksets are not iterable,
     * so we must use a Set.
     */
    Set<AnyScopeTuple>
  >();

  /**
   * A weakset that makes sure that we never call a cleanup
   * function more than once.
   *
   * Think of every callback having an `hasBeenRun` property:
   *
   * `callback.hasBeenRun = true`.
   *
   * You can also think of this as a Map<CleanupCallback, boolean>
   * where we set the value to "true" once the callback has
   * been run:
   *
   * `hasBeenRun.set(callback, true)`
   *
   * The weakset provides a simpler, mutation free and memory
   * efficient way to signal that the callback has been run
   * and need not be run again.
   *
   * Without this weakset, we would need more coordination to ensure
   * a callback is only run once.
   */
  const cleanupsRun = new WeakSet<CleanupCallback>();

  const releasedSubscriptions = new WeakSet<Symbol>();

  function getScopes<T>(
    tuples: ScopeTuple<T>[],
    subscriptionId: Symbol,
  ): ScopeTuple<T>[] {
    return tuples.map((t) => getScope(t, subscriptionId));
  }

  /**
   * Creates a memoized tuple of `[scope,value]`
   *
   * Registers primitive `value`s in the primitive scope cache. This has side-effects
   * and needs to be cleaned up with `deregisterScopeTuple`
   *
   */
  function getScope<T>(
    tuple: ScopeTuple<T>,
    subscriptionId: Symbol,
  ): ScopeTuple<T> {
    if (releasedSubscriptions.has(subscriptionId)) {
      throw new Error(
        "Can't extend a subscription has already been released. Use a new subscription ID instead.",
      );
    }
    const [scope, value] = tuple;

    // Timing issue. What happens if the cache is empty between
    // when this function was created and when it was run?
    // const start = () => startSubscription<T>(subscriptionId, tuple);

    const cached = scopeCache.get(scope)?.get(value);
    if (cached) {
      return cached.tuple as ScopeTuple<T>;
    }
    return tuple;
  }

  /**
   * Mutates the cache and starts the subscription
   *
   * @param subscriptionId
   * @param tuple
   */
  function startSubscription<T>(
    subscriptionId: Symbol,
    tuple: ScopeTuple<T>,
  ): ScopeTuple<T> {
    const [scope, value] = tuple;
    const innerCached = scopeCache.get(scope)?.get(value);
    if (innerCached) {
      // Increment references
      innerCached.references.add(subscriptionId);
      trackSubcription(subscriptionId, innerCached.tuple as ScopeTuple<T>);
      return innerCached.tuple as ScopeTuple<T>;
    } else {
      // Get or create initial map
      const valuesForScope =
        scopeCache.get(scope) ?? scopeCache.set(scope, new Map()).get(scope)!;

      // Increment references
      valuesForScope.set(value, {
        tuple,
        references: new Set<Symbol>([subscriptionId]),
        cleanups: new Set(),
      });

      trackSubcription(subscriptionId, tuple);
      return tuple;
    }
  }

  function startSubscriptions(
    subscriptionId: Symbol,
    tuples: AnyScopeTuple[],
  ): AnyScopeTuple[] {
    return tuples.map((t) => startSubscription(subscriptionId, t));
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
  function stopSubscription(subscriptionId: Symbol) {
    if (releasedSubscriptions.has(subscriptionId)) {
      // throw new Error(
      //   "Can't release a subscription that has already been released. Don't call unsub twice.",
      // );
      return;
    } else {
      releasedSubscriptions.add(subscriptionId);
    }
    const tuples = subscriptionIdToTuples.get(subscriptionId);
    if (!tuples) return;

    const cleanupsToRun = new Set<CleanupCallback>();
    tuples.forEach(([scope, value]) => {
      const scopeMap = scopeCache.get(scope);
      const cached = scopeMap?.get(value);

      const references = cached?.references;
      references?.delete(subscriptionId);

      if (references && references.size <= 0) {
        scopeMap?.delete(value);

        // Run all cleanups
        cached?.cleanups.forEach((cb) => {
          cleanupsToRun.add(cb);
        });
      } else {
        // Not empty yet, do not run cleanups
      }
    });

    Array.from(cleanupsToRun.values())
      .reverse()
      .forEach((cb) => {
        if (!cleanupsRun.has(cb)) {
          // Only runs cleanups that haven't already been run
          cb();
          cleanupsRun.add(cb);
        }
      });
  }

  function registerCleanups(
    scopeKeys: AnyScopeTuple[],
    cleanupSet: Set<CleanupCallback>,
  ) {
    scopeKeys.forEach(([scopeKey, scopeValue]) => {
      cleanupSet.forEach((cleanup) => {
        scopeCache.get(scopeKey)?.get(scopeValue)?.cleanups.add(cleanup);
      });
    });
  }

  function useScopes(
    ...scopes: AnyScopeTuple[]
  ): ReturnType<MoleculeInjector["useScopes"]> {
    const subscriptionId = createSubId();
    return startOrExpandSubscription(subscriptionId, ...scopes);
  }

  function startOrExpandSubscription(
    subscriptionId: Symbol,
    ...scopes: AnyScopeTuple[]
  ): ReturnType<MoleculeInjector["useScopes"]> {
    const tuples = getScopes(scopes, subscriptionId);
    const leased = startSubscriptions(subscriptionId, scopes);

    if (!shallowEqual(tuples, leased)) {
      throw new Error("Leased scopes don't match actual scopes");
    }

    const unsub = () => {
      stopSubscription(subscriptionId);
    };

    return [tuples, unsub];
  }

  function createSubscription(): ScopeSubscription {
    let subId: symbol | undefined = createSubId();
    const tupleMap = new Map<AnyMoleculeScope, AnyScopeTuple>();

    function restart() {
      subId = createSubId();
      getScopes(Array.from(tupleMap.values()), subId);
      return startSubscriptions(subId, Array.from(tupleMap.values()));
    }
    return {
      tuples() {
        return Array.from(tupleMap.values());
      },
      expand(next: AnyScopeTuple[]) {
        if (!subId)
          throw new Error(
            "Can't expand a subscription that is already stopped",
          );
        const tuples = getScopes(next, subId);
        tuples.forEach((t) => {
          tupleMap.set(t[0], t);
        });
        return tuples;
      },
      start() {
        if (!subId) {
          return restart();
        }
        return startSubscriptions(subId, Array.from(tupleMap.values()));
      },
      stop() {
        if (!subId)
          throw new Error("Can't stop a subscription that is already stopped");
        stopSubscription(subId);
        subId = undefined;
      },
    };
  }

  return {
    useScopes,
    registerCleanups,
    startOrExpandSubscription,
    stopSubscription,
    createSubscription,
  };
}

export type ScopeSubscription = {
  tuples(): AnyScopeTuple[];
  expand(next: AnyScopeTuple[]): AnyScopeTuple[];
  start(): AnyScopeTuple[];
  stop(): void;
};

function shallowEqual(first: unknown[], second: unknown[]): boolean {
  if (first.length !== second.length) {
    return false;
  }
  return first.every((item, index) => item === second[index]);
}
