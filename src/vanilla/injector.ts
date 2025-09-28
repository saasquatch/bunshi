import { instanceId } from "./instanceIds";
import {
  ErrorAsyncGetMol,
  ErrorAsyncGetScope,
  ErrorBadUse,
  ErrorInvalidMolecule,
  ErrorInvalidScope,
  ErrorUnboundMolecule,
} from "./internal/errors";
import type { Instrumentation } from "./internal/instrumentation";
import type {
  AnyMolecule,
  AnyMoleculeInterface,
  AnyMoleculeScope,
  AnyScopeTuple,
  MoleculeInternal,
} from "./internal/internal-types";
import type { MoleculeCacheValue } from "./internal/internal-types";
import { scopeTupleSort } from "./internal/scopeTupleSort";
import {
  GetterSymbol,
  GlobalScopeSymbol,
  Injector,
  TypeSymbol,
} from "./internal/symbols";
import {
  isMolecule,
  isMoleculeInterface,
  isMoleculeScope,
} from "./internal/utils";
import { createDeepCache } from "./internal/weakCache";
import {
  onMountImpl,
  useImpl,
  type CleanupCallback,
  type InternalUse,
  type MountedCallback,
} from "./lifecycle";
import type {
  Molecule,
  MoleculeGetter,
  MoleculeOrInterface,
  ScopeGetter,
} from "./molecule";
import { createScope } from "./scope";
import { type ScopeSubscription, createScoper } from "./scoper";
import type { BindingMap, Bindings, Injectable } from "./types";

let globalScopeId = 0;

type UseScopeDetails = {
  value: unknown;
  defaultScopes: Set<AnyMoleculeScope>;
};

type Unsub = () => unknown;

/**
 * Builds the graphs of molecules that make up your application.
 *
 * The injector tracks the dependencies for each molecule and uses bindings to inject them.
 *
 * This "behind-the-scenes" operation is what distinguishes dependency injection from its cousin, the service locator pattern.
 *
 * From Dependency Injection: https://en.wikipedia.org/wiki/Dependency_injection
 *
 * > The injector, sometimes also called an assembler, container, provider or factory, introduces services to the client.
 * > The role of injectors is to construct and connect complex object graphs, where objects may be both clients and services.
 * > The injector itself may be many objects working together, but must not be the client, as this would create a circular dependency.
 * > Because dependency injection separates how objects are constructed from how they are used,
 * > it often diminishes the importance of the `new` keyword found in most object-oriented languages.
 * > Because the framework handles creating services, the programmer tends to only directly construct value objects which represents entities
 * > in the program's domain (such as an Employee object in a business app or an Order object in a shopping app).
 *
 * This is the core of bunshi, although you may rarely interact with it directly.
 */
export type MoleculeInjector = {
  /**
   * Get the molecule value for an optional scope. Expects scope tuples to be memoized ahead of time.
   *
   * @param molecule
   * @param scopes
   */
  get<T>(molecule: MoleculeOrInterface<T>, ...scopes: AnyScopeTuple[]): T;

  /**
   * Use a molecule, and memoizes scope tuples.
   *
   * Returns a function to cleanup scope tuples.
   *
   * @param molecule
   * @param scopes
   */
  use<T>(
    molecule: MoleculeOrInterface<T>,
    ...scopes: AnyScopeTuple[]
  ): [T, Unsub];

  /**
   * Use a molecule, and memoizes scope tuples.
   *
   * Returns a function to cleanup scope tuples.
   *
   * @param molecule
   * @param scopes
   */
  useLazily<T>(
    molecule: MoleculeOrInterface<T>,
    ...scopes: AnyScopeTuple[]
  ): [T, { start: () => T; stop: Unsub }];

  /**
   * Use and memoize scopes.
   *
   * Returns a function to cleanup scope tuples.
   *
   * @param scopes
   */
  useScopes(...scopes: AnyScopeTuple[]): [AnyScopeTuple[], Unsub];

  /**
   * Use and memoize scopes.
   *
   * Returns a function to cleanup scope tuples.
   *
   * @param scopes
   */
  createSubscription(): ScopeSubscription;
} & Record<symbol, unknown>;

/**
 * Optional properties for creating a {@link MoleculeInjector} via {@link createInjector}
 */
export type CreateInjectorProps = {
  /**
   * A set of bindings to replace the implemenation of a {@link MoleculeInterface} or
   * a {@link Molecule} with another {@link Molecule}.
   *
   * Bindings are useful for swapping out implementations of molecules during testing,
   * and for library authors to create shareable molecules that may not have a default
   * implementation
   */
  bindings?: Bindings;

  /**
   * Instrumentation to observe the internals of the caches
   * uses in the injector
   */
  instrumentation?: Instrumentation;
};

function bindingsToMap(bindings?: Bindings): BindingMap {
  if (!bindings) return new Map();
  if (Array.isArray(bindings)) {
    return new Map(bindings);
  }
  // Clones the map to prevent future editing of the original
  return new Map(bindings.entries());
}

/**
 * Creates a {@link MoleculeInjector}
 *
 * This is the core stateful component of `bunshi` and can have interfaces bound to implementations here.
 *
 * @example
 * Create an injector with bindings
 *
 * ```ts
 * const NumberMolecule = moleculeInterface<number>();
 * const RandomNumberMolecule = molecule<number>(()=>Math.random());
 *
 * const injector = createInjector({
 *     bindings:[[NumberMolecule,RandomNumberMolecule]]
 * })
 * ```
 */
export function createInjector(
  injectorProps: CreateInjectorProps = {},
): MoleculeInjector {
  /*
   *
   *
   *     State
   *
   *
   */
  const moleculeCache = createDeepCache<
    AnyMolecule | AnyScopeTuple,
    MoleculeCacheValue
  >();

  /**
   * The Dependency Cache reduces the number of times that a molecule needs
   * to be run to determine it's dependencies.
   *
   * Give a molecule, what scopes might it depend on?
   */
  const dependencyCache: WeakMap<
    /**
     * The key is the molecule itself
     */
    AnyMolecule,
    /**
     * This can be a weak set because it's only ever used to determine
     * if the scopes in context should apply to this molecule.
     *
     * For example:
     *  - Molecule is used with scopes context A, B and C
     *  - This set contains B, C and D
     *  - The relevant scopes are B and C
     *  - This set doesn't need to be iterable, because the scope context (e.g. A, B and C) is iterable
     */
    Set</**
     * We only need to store the scope keys, not the scope values.
     */
    AnyMoleculeScope>
  > = new WeakMap();

  const bindings = bindingsToMap(injectorProps.bindings);

  /**
   * The scoper contains all the subscriptions and leases for managing scope lifecycle,
   * ensuring scope tuples are memoizable keys for use in the injector.
   *
   *  - The scoper keeps track of "how long should this thing be alive"?
   *  - The injector keeps track of the instances of the things, and all dependency magic
   */
  const scoper = createScoper(injectorProps.instrumentation);

  /**
   * Lookup bindings to override a molecule, or throw an error for unbound interfaces
   *
   */
  function getTrueMolecule<T>(
    molOrIntf: MoleculeOrInterface<T>,
  ): MoleculeInternal<T> {
    const bound = bindings.get(molOrIntf);
    if (bound) return bound as MoleculeInternal<T>;
    if (isMolecule(molOrIntf)) return molOrIntf as MoleculeInternal<T>;

    throw new Error(ErrorUnboundMolecule);
  }

  function getInternal<T>(
    m: Molecule<T>,
    props: CreationProps,
  ): MoleculeCacheValue {
    injectorProps.instrumentation?.getInternal(m);
    const cachedDeps = dependencyCache.get(m);

    if (cachedDeps) {
      /**
       * Stage 1 cache
       *
       * If we have hit this case, then the molecule has been run at least once
       * before, and during that run produced a set of scope keys that it
       * depends on.
       *
       * We don't support conditional dependencies, and that case is caught
       * if we run a molecule twice and it has a different set of dependencies.
       */

      const relevantScopes = props.scopes.filter((tuple) =>
        cachedDeps.has(tuple[0]),
      );

      const deps = getCachePath(relevantScopes, m);
      const cachedValue = moleculeCache.get(deps);

      if (cachedValue) {
        // Extend the lease to include the any default scopes
        // that are implicitly leased
        cachedValue.deps.defaultScopes.forEach((s) => {
          props.lease(s.defaultTuple);
        });

        injectorProps.instrumentation?.stage1CacheHit(m, cachedValue);
        return cachedValue;
      } else {
        /**
         * Fall through to Stage 2 cache
         *
         * We don't want to be creating anything new here, we
         * just want to fall back to the regular handling of
         * molecules
         */
      }
    }
    injectorProps.instrumentation?.stage1CacheMiss();
    const { previous } = props;
    if (previous !== false) {
      return moleculeCache.deepCache(
        () => previous,
        () => {},
        previous.path,
      );
    }
    return runAndCache<T>(m, props);
  }

  function multiCache(
    mol: AnyMolecule,
    scopes: AnyScopeTuple[],
    createFn: () => Omit<Omit<MoleculeCacheValue, "path">, "instanceId">,
    foundFn: (found: MoleculeCacheValue) => void,
  ): MoleculeCacheValue | undefined {
    const deps = getCachePath(scopes, mol);

    const cached = moleculeCache.deepCache(
      () => {
        const innerCached = {
          ...createFn(),
          path: deps,
          instanceId: instanceId(),
        };

        return innerCached;
      },
      foundFn,
      deps,
    );
    return cached;
  }

  function runAndCache<T>(
    m: Molecule<T>,
    props: CreationProps,
  ): MoleculeCacheValue {
    const getScopeValue = (scope: AnyMoleculeScope): UseScopeDetails => {
      const defaultScopes = new Set<AnyMoleculeScope>();

      const found = props.scopes.find(([key]) => key === scope);
      if (found) {
        const isDefaultValue = found[1] === found[0].defaultValue;
        if (!isDefaultValue) {
          /**
           * Return early when a default scope value is being used explicitly.
           * This prevent us from "forking" and have multiple scope
           * tuples to use as keys when the default tuple will do
           */
          return {
            value: found[1],
            defaultScopes,
          };
        } else {
          // Fallthrough the default value handling below
        }
      }

      defaultScopes.add(scope);
      return {
        value: scope.defaultValue,
        defaultScopes,
      };
    };

    const mounted = runMolecule(
      m,
      getScopeValue,
      (m) => getInternal(m, props),
      getTrueMolecule,
    );
    injectorProps.instrumentation?.executed(m, mounted);

    const relatedScope = props.scopes.filter(([key]) =>
      mounted.deps.allScopes.has(key),
    );

    if (dependencyCache.has(m)) {
      const cachedDeps = dependencyCache.get(m)!;
      if (mounted.deps.allScopes.size !== cachedDeps?.size) {
        throw new Error(
          "Molecule is using conditional dependencies. This is not supported.",
        );
      }
      let mismatch = false;
      mounted.deps.allScopes.forEach((s) => {
        if (!cachedDeps.has(s)) {
          mismatch = true;
        }
      });
      if (mismatch) {
        throw new Error(
          "Molecule is using conditional dependencies. This is not supported.",
        );
      }
    } else {
      dependencyCache.set(m, mounted.deps.allScopes);
    }
    return multiCache(
      m,
      relatedScope,
      () => {
        // No molecule exists, so mount a new one
        mounted.deps.defaultScopes.forEach((s) => {
          props.lease(s.defaultTuple);
        });
        const created = {
          deps: mounted.deps,
          value: mounted.value,
          isMounted: false,
        };
        injectorProps.instrumentation?.stage2CacheMiss(created);
        return created;
      },
      (found) => {
        // Extend the lease to include the any default scopes
        // that are implicitly leased
        found.deps.defaultScopes.forEach((s) => {
          props.lease(s.defaultTuple);
        });
        injectorProps.instrumentation?.stage2CacheHit(m, found);
      },
    ) as MoleculeCacheValue;
  }

  function runMount(mol: MoleculeCacheValue) {
    if (mol.isMounted) {
      // Don't re-run a molecule
      return mol;
    }

    // Don't re-run
    mol.isMounted = true;

    // Recurses through the transient dependencies
    mol.deps.buddies.forEach(runMount);

    const cleanupSet = new Set<CleanupCallback>();

    mol.deps.mountedCallbacks.forEach((onMount) => {
      // Call all the mount functions for the molecule
      const cleanup = onMount();

      // Queues up the cleanup functions for later
      if (cleanup) {
        cleanupSet.add(cleanup);
      }
    });

    cleanupSet.add(function moleculeCacheCleanup() {
      injectorProps.instrumentation?.cleanup(mol);

      /**
       * Purge the molecule cache when the scope set is released
       *
       * Since the moleculeCache is a weak cache, it will be cleaned up
       * automatically when scopes and molecules are garbage collected,
       * but if they aren't garbage collected, then there will continue to
       * be a cached molecule value stored, and then lifecycle hooks will never be
       * run.
       *
       * Without this repeated calls to `injector.use` would not create
       * new values, and would not run lifecycle hooks (mount, unmount).
       */
      moleculeCache.remove(...mol.path);
      mol.isMounted = false;
    });

    /**
     * Used scopes are different than the molecule path.
     *
     * The molecule path is simplified because ignores any default scope tuples.
     *
     * But registering cleanups, we still need to listen to unmounts for default scopes
     */
    const usedDefaultScopes = Array.from(mol.deps.defaultScopes.values()).map(
      (s) => s.defaultTuple,
    );
    scoper.registerCleanups(usedDefaultScopes, cleanupSet);

    /**
     * These are the scopes that were implicitly provided when the molecule
     * was created
     */
    const usedScopes = mol.path.filter((molOrScope) =>
      Array.isArray(molOrScope),
    ) as AnyScopeTuple[];
    scoper.registerCleanups(usedScopes, cleanupSet);

    injectorProps?.instrumentation?.mounted(mol, usedScopes, cleanupSet);

    return mol;
  }

  function get<T>(m: MoleculeOrInterface<T>, ...scopes: AnyScopeTuple[]): T {
    const [value, unsub] = use(m, ...scopes);
    // unsub();
    return value;
  }

  function use<T>(
    m: MoleculeOrInterface<T>,
    ...scopes: AnyScopeTuple[]
  ): [T, Unsub] {
    const [moleculeValue, options] = lazyUse(m, ...scopes);

    return [options.start(), options.stop];
  }

  function lazyUse<T>(
    m: MoleculeOrInterface<T>,
    ...scopes: AnyScopeTuple[]
  ): [T, { start: () => T; stop: Unsub }] {
    if (!isMolecule(m) && !isMoleculeInterface(m))
      throw new Error(ErrorInvalidMolecule);

    const sub = scoper.createSubscription();
    const tuples = sub.expand(scopes);
    const bound = getTrueMolecule(m);

    let state = MoleculeSubscriptionState.INITIAL;
    const lease = (tuple: AnyScopeTuple) => {
      const [memoized] = sub.expand([tuple]);
      return memoized;
    };

    let cacheValue = getInternal<T>(bound, {
      scopes: tuples,
      lease,
      previous: false,
    });

    const start = () => {
      if (state === MoleculeSubscriptionState.ACTIVE) {
        throw new Error("Don't start a subscription that is already started.");
      }
      injectorProps?.instrumentation?.subscribe(bound, cacheValue);

      cacheValue = getInternal<T>(bound, {
        scopes: sub.start(),
        lease,
        previous: cacheValue,
      });

      // Runs mounts
      runMount(cacheValue);
      state = MoleculeSubscriptionState.ACTIVE;
      return cacheValue.value as T;
    };
    const stop = () => {
      if (state === MoleculeSubscriptionState.STOPPED) {
        throw new Error("Don't start a subscription that is already started.");
      }
      injectorProps?.instrumentation?.unsubscribe(bound, cacheValue);
      sub.stop();
      state = MoleculeSubscriptionState.STOPPED;
    };

    return [cacheValue.value as T, { start, stop }];
  }

  return {
    [TypeSymbol]: Injector,
    get,
    use,
    useLazily: lazyUse,
    useScopes: scoper.useScopes,
    createSubscription: scoper.createSubscription,
  };
}

enum MoleculeSubscriptionState {
  INITIAL,
  ACTIVE,
  STOPPED,
}

/**
 * Create deterministic ordered array of dependencies
 * for looking up values in the deep cache.
 *
 * @param scopes
 * @param mol
 * @returns
 */
function getCachePath(scopes: AnyScopeTuple[], mol: AnyMolecule) {
  /**
   * Important: We filter out default scopes as a part of the cache path
   * because it makes it easier for us to find a molecule in our Stage 1
   * cache lookup (based only on previous lookups)
   */
  const nonDefaultScopes = scopes.filter((s) => s[0].defaultValue !== s[1]);

  /**
   * Important: Sorting of scopes is important to ensure a consistent path
   * for storing (and finding) molecules in the deep cache tree
   */
  const deps = [mol, ...scopeTupleSort(nonDefaultScopes)];
  return deps;
}

/**
 * Create a new instance of a molecule
 *
 */
function runMolecule(
  maybeMolecule: AnyMolecule,
  getScopeValue: (scope: AnyMoleculeScope) => UseScopeDetails,
  getMoleculeValue: (mol: AnyMolecule) => MoleculeCacheValue,
  getTrueMolecule: (
    molOrIntf: AnyMolecule | AnyMoleculeInterface,
  ) => MoleculeInternal<unknown>,
) {
  const m = getTrueMolecule(maybeMolecule);

  const dependentMolecules = new Set<AnyMolecule>();
  const allScopes = new Set<AnyMoleculeScope>();
  const defaultScopes = new Set<AnyMoleculeScope>();
  const mountedCallbacks = new Set<MountedCallback>();
  const buddies: MoleculeCacheValue[] = [];

  const use: InternalUse = (dep: Injectable<unknown>) => {
    if (isMoleculeScope(dep)) {
      allScopes.add(dep);
      const scopeDetails = getScopeValue(dep);
      scopeDetails.defaultScopes.forEach((s) => defaultScopes.add(s));
      return scopeDetails.value;
    }
    if (isMolecule(dep) || isMoleculeInterface(dep)) {
      const dependentMolecule = getTrueMolecule(dep);
      dependentMolecules.add(dependentMolecule);
      const mol = getMoleculeValue(dependentMolecule);
      mol.deps.allScopes.forEach((s) => allScopes.add(s));
      mol.deps.defaultScopes.forEach((s) => {
        defaultScopes.add(s);
      });
      buddies.push(mol);
      return mol.value as any;
    }
    throw new Error(ErrorBadUse);
  };

  const trackingScopeGetter: ScopeGetter = (s) => {
    if (!running) throw new Error(ErrorAsyncGetScope);
    if (!isMoleculeScope(s)) throw new Error(ErrorInvalidScope);
    return use(s);
  };

  const trackingGetter: MoleculeGetter = (molOrInterface) => {
    if (!running) throw new Error(ErrorAsyncGetMol);
    if (!isMolecule(molOrInterface) && !isMoleculeInterface(molOrInterface))
      throw new Error(ErrorInvalidMolecule);
    return use(molOrInterface);
  };

  onMountImpl.push((fn: MountedCallback) => mountedCallbacks.add(fn));
  useImpl.push(use);
  let running = true;

  /**
   * Create or reuse a unique internal global scope for this molecule.
   * This ensures cleanup mechanisms work properly via the normal scope lifecycle.
   */
  if (!m[GlobalScopeSymbol]) {
    const id = ++globalScopeId;
    m[GlobalScopeSymbol] = createScope(Symbol(`bunshi.global.scope.${id}`), {
      debugLabel: `Global Scope ${id}`,
    });
  }
  trackingScopeGetter(m[GlobalScopeSymbol]);

  try {
    const value = m[GetterSymbol](trackingGetter, trackingScopeGetter);
    return {
      deps: {
        molecules: dependentMolecules,
        allScopes,
        defaultScopes,
        mountedCallbacks,
        /**
         * Returns a copy
         *
         * Reverses the order so that the deepest dependencies are at the top
         * of the list. This will be important for ensuring ordering for how
         * mounts are called with transient dependencies.
         *
         */
        buddies: buddies.slice().reverse(),
      },
      value,
    };
  } finally {
    running = false;
    onMountImpl.pop();
    useImpl.pop();
  }
}

type CreationProps = {
  lease: (tuple: AnyScopeTuple) => AnyScopeTuple;
  scopes: AnyScopeTuple[];
  previous: MoleculeCacheValue | false;
};
