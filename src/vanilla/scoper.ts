import type { MoleculeInjector } from ".";
import type {
  AnyMoleculeScope,
  AnyScopeTuple,
} from "./internal/internal-types";
import { Debug } from "./internal/symbols";
import type { CleanupCallback } from "./lifecycle";
import type { ScopeTuple } from "./types";

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
    Map<
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

  function leaseScopes<T>(
    tuples: ScopeTuple<T>[],
    subscriptionId: Symbol,
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
    subscriptionId: Symbol,
  ): ScopeTuple<T> {
    if (releasedSubscriptions.has(subscriptionId)) {
      throw new Error(
        "Can't extend a subscription has already been released. Use a new subscription ID instead.",
      );
    }
    const [scope, value] = tuple;

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

    valuesForScope.set(value, {
      tuple,
      references: new Set<Symbol>([subscriptionId]),
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
  function unleaseScopes(subscriptionId: Symbol) {
    if (releasedSubscriptions.has(subscriptionId)) {
      throw new Error(
        "Can't release a subscription that has already been released. Don't call unsub twice.",
      );
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
        console.log("-> Empty!", subscriptionId, scope[Debug]);
        scopeMap?.delete(value);

        // Run all cleanups
        cached?.cleanups.forEach((cb) => {
          console.log("---> Queue cleanup", subscriptionId, cb);
          cleanupsToRun.add(cb);
        });
      } else {
        console.log("-> Not empty yet", subscriptionId);
      }
    });

    cleanupsToRun.forEach((cb) => {
      if (!cleanupsRun.has(cb)) {
        // Only runs cleanups that haven't already been run
        console.log("---> Run cleanup", subscriptionId, cb);
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

  /**
   * The subscriptionIndex provides a unique name to use
   * in debugging.
   *  - It does not need to be unique
   *  - It does not need to auto-increment,
   *  - It does not need to be a number
   *  - It has to affect on business logic
   *  - It's only for display purposes
   */
  let subscriptionIndex = 0;

  function useScopes(
    ...scopes: AnyScopeTuple[]
  ): ReturnType<MoleculeInjector["useScopes"]> {
    const subscriptionId = Symbol(
      // This name is only used for display purposes
      // Do NOT replace this `Symbol` with `Symbol.for`
      // it is NOT intended to be global
      `bunshi.scope.sub ${subscriptionIndex++}`,
    );
    return leaseSubId(subscriptionId, ...scopes);
  }

  function leaseSubId(
    subscriptionId: Symbol,
    ...scopes: AnyScopeTuple[]
  ): ReturnType<MoleculeInjector["useScopes"]> {
    console.log(
      "Started subscription",
      subscriptionId,
      scopes.map((s) => s[0][Debug]),
    );

    const tuples = leaseScopes(scopes, subscriptionId);
    const unsub = () => {
      console.log("Released subscription", subscriptionId);

      unleaseScopes(subscriptionId);
    };

    return [tuples, unsub, { subscriptionId }];
  }

  return {
    useScopes,
    registerCleanups,
    leaseScope,
    leaseSubId,
  };
}
