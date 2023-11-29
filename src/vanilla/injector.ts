import { getInstanceId, trackInstanceId } from "./instanceIds";
import {
  ErrorAsyncGetMol,
  ErrorAsyncGetScope,
  ErrorBadUse,
  ErrorInvalidMolecule,
  ErrorInvalidScope,
  ErrorUnboundMolecule,
} from "./internal/errors";
import type {
  AnyMolecule,
  AnyMoleculeInterface,
  AnyMoleculeScope,
  AnyScopeTuple,
  MoleculeInternal,
} from "./internal/internal-types";
import { scopeTupleSort } from "./internal/scopeTupleSort";
import { Debug, GetterSymbol, Injector, TypeSymbol } from "./internal/symbols";
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
import { createScoper } from "./scoper";
import type { BindingMap, Bindings, Injectable } from "./types";

const InternalOnlyGlobalScope = createScope(
  Symbol("bunshi.global.scope.value"),
  { debugLabel: "Global Scope" },
);

type Deps = {
  allScopes: Set<AnyMoleculeScope>;
  defaultScopes: Set<AnyMoleculeScope>;
  mountedCallbacks: Set<MountedCallback>;
};

/**
 * The value stored in the molecule cache
 */
type MoleculeCacheValue = {
  deps: Deps;
  value: unknown;
  isMounted: boolean;
  path: (AnyScopeTuple | AnyMolecule)[];
};

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
   * Get the molecule value for an optional scope. Expects scope tuples to be memoized ahead of time.
   *
   * @param molecule
   * @param scopes
   */
  get<T>(
    molecule: MoleculeOrInterface<T>,
    context: { subscriptionId?: Symbol },
    ...scopes: AnyScopeTuple[]
  ): T;

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
  ): [T, Unsub, { subscriptionId: Symbol }];

  /**
   * Use a molecule, and memoizes scope tuples.
   *
   * Returns a function to cleanup scope tuples.
   *
   * @param molecule
   * @param scopes
   */
  lazyUse<T>(
    molecule: MoleculeOrInterface<T>,
    ...scopes: AnyScopeTuple[]
  ): [T, { subscriptionId: Symbol; start: Unsub; stop: Unsub }];

  /**
   * Use and memoize scopes.
   *
   * Returns a function to cleanup scope tuples.
   *
   * @param scopes
   */
  useScopes(
    ...scopes: AnyScopeTuple[]
  ): [AnyScopeTuple[], Unsub, { subscriptionId: Symbol }];

  /**
   * Use and memoize scopes.
   *
   * Returns a function to cleanup scope tuples.
   *
   * @param scopes
   */
  startSubscription(
    subscriptionId: Symbol,
    ...scopes: AnyScopeTuple[]
  ): [AnyScopeTuple[], Unsub, { subscriptionId: Symbol }];

  stopSubscription(subscriptionId: Symbol): void;
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
  props: CreateInjectorProps = {},
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
     *  - This set doesn't need to be iterable, because the scope context (A, B and C) is iterable
     */
    WeakSet</**
     * We only need to store the scope keys, not the scope values.
     */
    AnyMoleculeScope>
  > = new WeakMap();

  const bindings = bindingsToMap(props.bindings);

  /**
   * The scoper contains all the subscriptions and leases for managing scope lifecycle,
   * ensuring scope tuples are memoizable keys for use in the injector.
   *
   *  - The scoper keeps track of "how long should this thing be alive"?
   *  - The injector keeps track of the instances of the things, and all dependency magic
   */
  const scoper = createScoper();

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
    const cachedDeps = dependencyCache.get(m);

    const { scopes } = props;
    if (cachedDeps) {
      const foundScopes = scopes.filter(([key]) => cachedDeps.has(key));
      const dependencies = getDependencies(foundScopes, m);

      console.log("!!! FOUND: Dependencies");
      const cacheValue = multiCache(
        // Not found
        () => {
          console.log("!!! EMPTY: Molecule value stage 1");
          return runAndCache(m, props);
        },
        // Found
        (found) => {
          console.log("!!! FOUND: Molecule value stage 1");

          // Extend the lease to include the any default scopes
          // that are implicitly leased
          found.deps.defaultScopes.forEach((s) => {
            props.lease([s, s.defaultValue]);
          });
        },
        dependencies,
      ) as MoleculeCacheValue;

      return runMount(cacheValue, props);
    }
    const cacheValue = runAndCache<T>(m, props);
    return runMount(cacheValue, props);
  }

  function multiCache(
    createFn: () => Omit<MoleculeCacheValue, "path">,
    foundFn: (found: MoleculeCacheValue) => void,
    deps: (AnyScopeTuple | AnyMolecule)[],
  ): MoleculeCacheValue {
    const cached = moleculeCache.deepCache(
      () => {
        return { ...createFn(), path: deps };
      },
      foundFn,
      deps,
    );
    return cached;
  }

  function runAndCache<T>(m: Molecule<T>, props: CreationProps) {
    const defaultScopeTuples = new Set<AnyScopeTuple>();

    const getScopeValue = (scope: AnyMoleculeScope): UseScopeDetails => {
      const defaultScopes = new Set<AnyMoleculeScope>();

      const found = props.scopes.find(([key]) => key === scope);
      if (found) {
        const isDefaultValue = found[1] === found[0].defaultValue;
        if (!isDefaultValue) {
          return {
            value: found[1],
            defaultScopes,
          };
        } else {
          // Fallthrough the default value handling below
        }
      }

      const defaultTuple: AnyScopeTuple = props.lease([
        scope,
        scope.defaultValue,
      ]);
      defaultScopeTuples.add(defaultTuple);
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
    trackInstanceId(mounted.value);

    const relatedScope = props.scopes.filter(([key]) =>
      mounted.deps.allScopes.has(key),
    );

    const scopeKeySet =
      dependencyCache.get(m) ?? new WeakSet<AnyMoleculeScope>();
    mounted.deps.allScopes.forEach((s) => scopeKeySet.add(s));
    dependencyCache.set(m, scopeKeySet);

    const scopeKeys: AnyScopeTuple[] = [
      ...relatedScope,
      ...Array.from(defaultScopeTuples.values()),
    ];
    const scopeCacheKeys: AnyScopeTuple[] = [...relatedScope].filter(
      ([key, value]) => key.defaultValue !== value,
    );
    const dependencies = [...scopeTupleSort(scopeCacheKeys), m];

    return multiCache(
      () => {
        // No molecule exists, so mount a new one
        console.log(
          "!!! EMPTY: Molecule value stage 2",
          getInstanceId(mounted.value),
        );

        // const cleanupSet = new Set<CleanupCallback>();

        // cleanupSet.add(() => {
        //   /**
        //    * Purge the molecule cache when the scope set is released
        //    *
        //    * Since the moleculeCache is a weak cache, it will be cleaned up
        //    * automatically when scopes and molecules are garbage collected,
        //    * but if they aren't garbage collected, then there will continue to
        //    * be a cached molecule value stored, and then lifecycle hooks will never be
        //    * run.
        //    *
        //    * Without this repeated calls to `injector.use` would not create
        //    * new values, and would not run lifecycle hooks (mount, unmount).
        //    */
        //   console.log("!!! Deleting cached value");
        //   moleculeCache.remove(...dependencies);
        // });

        // scoper.registerCleanups(scopeKeys, cleanupSet);

        return {
          deps: mounted.deps,
          value: mounted.value,
          isMounted: false,
          path: dependencies,
        };
      },
      (found) => {
        console.log(
          "!!!! FOUND: Molecule value stage 2",
          getInstanceId(mounted.value),
        );

        // Extend the lease to include the any default scopes
        // that are implicitly leased
        found.deps.defaultScopes.forEach((s) => {
          props.lease([s, s.defaultValue]);
        });
      },
      dependencies,
    ) as MoleculeCacheValue;
  }

  function runMount(mol: MoleculeCacheValue, props: CreationProps) {
    if (mol.isMounted) {
      console.log("!!! INFO: Not mounting, already mounted");
      // Don't re-run a molecule
      return mol;
    }

    if (props.isLazy) {
      console.log("!!! INFO: Not mounting, is used lazily");
      // Don't run mounts on lazy
      return mol;
    }
    console.log("!!! INFO: Running mount....");

    const scopes: AnyScopeTuple[] = props.scopes.filter(
      (s) => mol.deps.allScopes.has(s[0]), //|| mol.deps.defaultScopes.has(s[0]),
    );
    const cleanupSet = new Set<CleanupCallback>();

    // FIXME: Need to mount dependencies if they are unmounted, too!
    mol.deps.mountedCallbacks.forEach((onMount) => {
      // Call all the mount functions for the molecule
      const cleanup = onMount();

      // Queues up the cleanup functions for later
      if (cleanup) {
        console.log(
          "!!! --> Mounted cleanup",
          cleanup,
          scopes.map((s) => s[0][Debug]),
        );
        cleanupSet.add(cleanup);
      }
    });

    cleanupSet.add(function moleculeCacheCleanup() {
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
      console.log("!!! MUTATION: Removing molecule from cache");
      moleculeCache.remove(...mol.path);
    });

    scoper.registerCleanups(scopes, cleanupSet);

    // Don't re-run
    mol.isMounted = true;
    console.log(
      "!!! MUTATION: Ran mounts and queued cleanups",
      scopes.map((s) => s[0][Debug]),
    );

    return mol;
  }

  function get<T>(
    m: MoleculeOrInterface<T>,
    contextOrScope: unknown,
    ...scopes: AnyScopeTuple[]
  ): T {
    if (!isMolecule(m) && !isMoleculeInterface(m))
      throw new Error(ErrorInvalidMolecule);

    const bound = getTrueMolecule(m);

    if (!contextOrScope) {
      // No subscription ID, so nothing to expand
      const lease = (next: AnyScopeTuple) => next;
      // 2nd param is undefined
      // Molecules used without scopes or subscription
      return getInternal(bound, { lease, scopes }).value as T;
    } else if (Array.isArray(contextOrScope)) {
      const [key] = contextOrScope;
      if (!isMoleculeScope(key))
        throw new Error("Invalid molecule scope used.");
      // 2nd param is a scope
      // Molecule used without a context
      // No subscription ID, so nothing to expand
      const lease = (next: AnyScopeTuple) => next;
      return getInternal(bound, {
        lease,
        scopes: [contextOrScope as AnyScopeTuple, ...scopes],
      }).value as T;
    }
    // 3nd param is context
    // Extract subscription ID

    const { subscriptionId } = (contextOrScope ?? {}) as any;
    const lease = (next: AnyScopeTuple) => {
      // No subscription ID, so nothing to expand
      if (!subscriptionId) return next;
      const [[memoized]] = scoper.startOrExpandSubscription(
        subscriptionId,
        next,
      );
      return memoized;
    };
    return getInternal(bound, { lease, scopes }).value as T;
  }

  function use<T>(
    m: MoleculeOrInterface<T>,
    ...scopes: AnyScopeTuple[]
  ): [T, Unsub, { subscriptionId: Symbol }] {
    const [moleculeValue, options] = lazyUse(m, ...scopes);

    return [
      options.start(),
      options.stop,
      { subscriptionId: options.subscriptionId },
    ];
  }

  function lazyUse<T>(
    m: MoleculeOrInterface<T>,
    ...scopes: AnyScopeTuple[]
  ): [T, { subscriptionId: Symbol; start: () => T; stop: Unsub }] {
    if (!isMolecule(m) && !isMoleculeInterface(m))
      throw new Error(ErrorInvalidMolecule);

    const sub = scoper.createSubscription();

    const tuples = sub.expand(scopes);

    const bound = getTrueMolecule(m);

    const lease = (tuple: AnyScopeTuple) => {
      const [memoized] = sub.expand([tuple]);
      return memoized;
    };

    const value = getInternal<T>(bound, {
      scopes: tuples,
      lease,
      // Lazy so "mount" should never be called
      isLazy: true,
    }).value as T;

    const start = () => {
      // Leases the scope tuples for real
      // Re-runs the molecules
      const leasedTuples = sub.start();
      console.log(
        "Starting SUB",
        leasedTuples.map((t) => t[0][Debug]),
      );
      const value = getInternal<T>(bound, {
        scopes: leasedTuples,
        lease,
        // Not lazy this time!
        isLazy: false,
      }).value as T;
      return value;
    };

    return [value, { subscriptionId: sub.subId, start, stop: sub.stop }];
  }

  return {
    [TypeSymbol]: Injector,
    get,
    use,
    lazyUse,
    useScopes: scoper.useScopes,
    startSubscription: scoper.startOrExpandSubscription,
    stopSubscription: scoper.stopSubscription,
  };
}

function getDependencies(scopes: AnyScopeTuple[], m: AnyMolecule) {
  const scopeKeys = scopes.filter(([key, value]) => key.defaultValue !== value);
  const dependencies = [...scopeTupleSort(scopeKeys), m];
  return dependencies;
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
      mol.deps.mountedCallbacks.forEach((cb) => mountedCallbacks.add(cb));
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
  trackingScopeGetter(InternalOnlyGlobalScope);
  const value = m[GetterSymbol](trackingGetter, trackingScopeGetter);
  running = false;
  onMountImpl.pop();
  useImpl.pop();

  return {
    deps: {
      molecules: dependentMolecules,
      allScopes,
      defaultScopes,
      mountedCallbacks,
    },
    value,
  };
}

type CreationProps = {
  lease: (tuple: AnyScopeTuple) => AnyScopeTuple;
  scopes: AnyScopeTuple[];
  isLazy?: boolean;
};
