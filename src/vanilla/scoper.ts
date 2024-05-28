import type { MoleculeInjector } from ".";
import type { Instrumentation } from "./internal/instrumentation";
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
export function createScoper(instrumentation?: Instrumentation) {
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
         * A referentially-stable array (i.e. Tuple) for the scope value.
         *
         * This is used as a key in other places in WeakMap and WeakSet
         */
        tuple: AnyScopeTuple;

        /**
         * The set of subscription IDs that are using this scope value
         */
        references: Set<ScopeSubscription>;

        /**
         * These callbacks should be called when there are no more subscriptions
         */
        cleanups: Set<CleanupCallback>;
      }
    >
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

  function getScopes<T>(tuples: ScopeTuple<T>[]): ScopeTuple<T>[] {
    return tuples.map((t) => getScope(t));
  }

  /**
   * Creates a memoized tuple of `[scope,value]`
   *
   * Registers primitive `value`s in the primitive scope cache. This has side-effects
   * and needs to be cleaned up with `deregisterScopeTuple`
   *
   */
  function getScope<T>(tuple: ScopeTuple<T>): ScopeTuple<T> {
    const [scope, value] = tuple;

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
    subscriptionObj: ScopeSubscription,
    tuple: ScopeTuple<T>,
  ): ScopeTuple<T> {
    const [scope, value] = tuple;
    const innerCached = scopeCache.get(scope)?.get(value);
    if (innerCached) {
      // Increment references
      innerCached.references.add(subscriptionObj);
      return innerCached.tuple as ScopeTuple<T>;
    } else {
      // Get or create initial map
      const valuesForScope =
        scopeCache.get(scope) ?? scopeCache.set(scope, new Map()).get(scope)!;

      // Increment references
      valuesForScope.set(value, {
        tuple,
        references: new Set<ScopeSubscription>([subscriptionObj]),
        cleanups: new Set(),
      });

      return tuple;
    }
  }

  function startSubscriptions(
    subscriptionObj: ScopeSubscription,
    tuples: AnyScopeTuple[],
  ): AnyScopeTuple[] {
    return tuples.map((t) => startSubscription(subscriptionObj, t));
  }

  /**
   * For values that are "primitive" (not an object),
   * deregisters them from the primitive scope
   * cache to ensure no memory leaks
   */
  function stopSubscription(
    tuples: Set<AnyScopeTuple>,
    subscriptionObj: ScopeSubscription,
  ) {
    if (!tuples) return;

    const cleanupsToRun = releaseTuples(tuples, subscriptionObj);

    Array.from(cleanupsToRun.values())
      .reverse()
      .forEach((cb) => {
        if (!cleanupsRun.has(cb)) {
          instrumentation?.scopeRunCleanup(cb);
          // Only runs cleanups that haven't already been run
          cb();
          cleanupsRun.add(cb);
        }
      });
  }

  function releaseTuples(
    tuples: Set<AnyScopeTuple>,
    subscriptionObj: ScopeSubscription,
  ) {
    const cleanupsToRun = new Set<CleanupCallback>();
    tuples.forEach(([scope, value]) => {
      const scopeMap = scopeCache.get(scope);
      const cached = scopeMap?.get(value);

      const references = cached?.references;
      references?.delete(subscriptionObj);

      if (references && references.size <= 0) {
        instrumentation?.scopeStopWithCleanup(subscriptionObj, cached);
        scopeMap?.delete(value);

        // Run all cleanups
        cached?.cleanups.forEach((cb) => {
          cleanupsToRun.add(cb);
        });
      } else {
        instrumentation?.scopeStopWithCleanup(subscriptionObj, cached);
        // Not empty yet, do not run cleanups
      }
    });
    return cleanupsToRun;
  }

  function registerCleanups(
    scopeKeys: AnyScopeTuple[],
    cleanupSet: Set<CleanupCallback>,
  ) {
    scopeKeys.forEach(([scopeKey, scopeValue]) => {
      cleanupSet.forEach((cleanup) => {
        const cleanups = scopeCache.get(scopeKey)?.get(scopeValue)?.cleanups;
        if (!cleanups) {
          throw new Error("Can't register cleanups for uncached values");
        }
        cleanups.add(cleanup);
      });
    });
  }

  function useScopes(
    ...scopes: AnyScopeTuple[]
  ): ReturnType<MoleculeInjector["useScopes"]> {
    const subscription = createSubscription();
    subscription.expand(scopes);
    subscription.start();
    return [subscription.tuples, () => subscription.stop()];
  }

  function createSubscription(): ScopeSubscription {
    let internal = new ScopeSubscriptionImpl();
    let stopped = false;

    function restart() {
      const previousTuples = internal.tuples;
      internal = new ScopeSubscriptionImpl();
      internal.expand(previousTuples);
      return internal.start();
    }
    return {
      addCleanups(cleanups: Set<CleanupCallback>) {
        registerCleanups(this.tuples, cleanups);
      },
      get tuples() {
        return internal.tuples;
      },
      expand(next: AnyScopeTuple[]) {
        return internal.expand(next);
      },
      start() {
        if (stopped) {
          stopped = false;
          return restart();
        }
        return internal.start();
      },
      stop() {
        internal.stop();
        stopped = true;
      },
    };
  }

  class ScopeSubscriptionImpl implements ScopeSubscription {
    addCleanups(cleanups: Set<CleanupCallback>): void {
      registerCleanups(this.tuples, cleanups);
    }
    __tupleMap = new Map<AnyMoleculeScope, AnyScopeTuple>();
    __stableArray: AnyScopeTuple[] = [];
    get tuples(): AnyScopeTuple[] {
      return this.__stableArray;
    }
    expand(next: AnyScopeTuple[]) {
      const tuples = getScopes(next);
      tuples.forEach((t) => {
        this.__tupleMap.set(t[0], t);
      });
      this.__stableArray = Array.from(this.__tupleMap.values());
      return tuples;
    }
    start() {
      return startSubscriptions(this, this.__stableArray);
    }
    stop() {
      stopSubscription(new Set(this.tuples), this);
    }
  }

  return {
    useScopes,
    registerCleanups,
    createSubscription,
  };
}

export type ScopeSubscription = {
  tuples: AnyScopeTuple[];
  expand(next: AnyScopeTuple[]): AnyScopeTuple[];
  addCleanups(cleanups: Set<CleanupCallback>): void;
  start(): AnyScopeTuple[];
  stop(): void;
};
