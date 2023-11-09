import {
  ErrorAsyncGetMol,
  ErrorAsyncGetScope,
  ErrorInvalidGlobalInjector,
  ErrorInvalidMolecule,
  ErrorInvalidScope,
  ErrorUnboundMolecule,
} from "./internal/errors";
import type {
  AnyMolecule,
  AnyMoleculeScope,
  AnyScopeTuple,
  MoleculeInternal,
  ScopeTuple,
} from "./internal/internal-types";
import {
  DefaultInjector,
  GetterSymbol,
  Injector,
  TypeSymbol,
} from "./internal/symbols";
import {
  isInjector,
  isMolecule,
  isMoleculeInterface,
  isMoleculeScope,
} from "./internal/utils";
import { createDeepCache } from "./internal/weakCache";
import {
  CleanupCallback,
  InternalUse,
  MountedCallback,
  onMountImpl,
  useImpl,
} from "./lifecycle";
import type {
  Molecule,
  MoleculeGetter,
  MoleculeOrInterface,
  ScopeGetter,
} from "./molecule";
import type { BindingMap, Bindings, Injectable } from "./types";

/**
 * What is stored in the {@link ScopeCache}
 */
type ScopeCacheValue = {
  references: Set<Symbol>;
  tuple: AnyScopeTuple;
  cleanups: ScopeCleanups;
};

type ScopeCache = WeakMap<AnyMoleculeScope, Map<unknown, ScopeCacheValue>>;

type Deps = {
  scopes: Set<AnyMoleculeScope>;
  transitiveScopes: Set<AnyMoleculeScope>;
  // molecules: Set<AnyMolecule>;
};

/**
 * The value stored in the molecule cache
 */
type MoleculeCacheValue = {
  deps: Deps;
  value: unknown;
};

type ScopeCleanups = Set<CleanupCallback>;
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
   * Use and memoize scopes.
   *
   * Returns a function to cleanup scope tuples.
   *
   * @param scopes
   */
  useScopes(...scopes: AnyScopeTuple[]): [AnyScopeTuple[], Unsub];
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
  props: CreateInjectorProps = {}
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

  const scopeCache: ScopeCache = new WeakMap();
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

  const bindings = bindingsToMap(props.bindings);

  function leaseScopes<T>(
    tuples: ScopeTuple<T>[],
    subscriptionId: Symbol,
    scopeCache: ScopeCache
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
  /**
   * Lookup bindings to override a molecule, or throw an error for unbound interfaces
   *
   */
  function getTrueMolecule<T>(
    molOrIntf: MoleculeOrInterface<T>
  ): MoleculeInternal<T> {
    const bound = bindings.get(molOrIntf);
    if (bound) return bound as MoleculeInternal<T>;
    if (isMolecule(molOrIntf)) return molOrIntf as MoleculeInternal<T>;

    throw new Error(ErrorUnboundMolecule);
  }

  /**
   * Create a new instance of a molecule
   *
   */
  function runMolecule(
    maybeMolecule: AnyMolecule,
    getScopeValue: ScopeGetter,
    getMoleculeValue: (mol: AnyMolecule) => MoleculeCacheValue
  ) {
    const m = getTrueMolecule(maybeMolecule);

    const dependentMolecules = new Set<AnyMolecule>();
    const dependentScopes = new Set<AnyMoleculeScope>();
    const transientScopes = new Set<AnyMoleculeScope>();

    const use: InternalUse = (dep: Injectable<unknown>) => {
      if (isMoleculeScope(dep)) {
        dependentScopes.add(dep);
        return getScopeValue(dep);
      }
      if (isMolecule(dep) || isMoleculeInterface(dep)) {
        const dependentMolecule = getTrueMolecule(dep);
        dependentMolecules.add(dependentMolecule);
        const mol = getMoleculeValue(dependentMolecule);
        Array.from(mol.deps.scopes.values()).forEach((s) =>
          transientScopes.add(s)
        );
        Array.from(mol.deps.transitiveScopes.values()).forEach((s) =>
          transientScopes.add(s)
        );
        return mol.value as any;
      }
      throw new Error(
        "Can only call `use` with a molecule, interface or scope"
      );
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

    const mountedCallbacks = new Set<MountedCallback>();
    onMountImpl.push((fn: MountedCallback) => mountedCallbacks.add(fn));
    useImpl.push(use);
    let running = true;
    const value = m[GetterSymbol](trackingGetter, trackingScopeGetter);
    running = false;
    onMountImpl.pop();
    useImpl.pop();

    return {
      deps: {
        molecules: dependentMolecules,
        scopes: dependentScopes,
        transitiveScopes: transientScopes,
      },
      value,
      mountedCallbacks,
    };
  }

  function getInternal<T>(
    m: Molecule<T>,
    context: { subscriptionId?: Symbol },
    ...scopes: AnyScopeTuple[]
  ): MoleculeCacheValue {
    const defaultScopes = new Set<AnyScopeTuple>();
    const getScopeValue: ScopeGetter = (scope) => {
      const found = scopes.find(([key]) => key === scope);
      if (found) return found[1] as any;

      // FIXME: Need to generate a lease for this scope
      // for the subscription here to make sure that
      // `onUnmounted` can be used for default scopes

      let defaultTuple: AnyScopeTuple = [scope, scope.defaultValue];

      if (context.subscriptionId) {
        defaultTuple = leaseScope(defaultTuple, context.subscriptionId);
      }

      defaultScopes.add(defaultTuple);
      return scope.defaultValue;
    };

    const mounted = runMolecule(m, getScopeValue, (m) =>
      getInternal(m, context, ...scopes)
    );

    const relatedScope = scopes.filter(([key]) => mounted.deps.scopes.has(key));

    const transitiveRelatedScope = scopes.filter(([key]) =>
      mounted.deps.transitiveScopes.has(key)
    );

    const scopeKeys: AnyScopeTuple[] = [
      ...relatedScope,
      ...transitiveRelatedScope,
      ...Array.from(defaultScopes.values()),
    ];
    const dependencies = [
      ...relatedScope,
      ...transitiveRelatedScope,
      ...Array.from(mounted.deps.molecules.values()),
      m,
    ];

    return moleculeCache.deepCache(() => {
      // No molecule exists, so mount a new one

      if (mounted.mountedCallbacks.size > 0) {
        if (scopeKeys.length <= 0)
          throw new Error(
            "Can't use mount lifecycle in globally scoped molecules."
          );
        const combined: ScopeCleanups = new Set();
        mounted.mountedCallbacks.forEach((onMount) => {
          // Call all the mount functions for the molecule
          const cleanup = onMount();

          // Queues up the cleanup functions for later
          if (cleanup) combined.add(cleanup);
        });

        scopeKeys.forEach(([scopeKey, scopeValue]) => {
          combined.forEach((cleanup) => {
            scopeCache.get(scopeKey)?.get(scopeValue)?.cleanups.add(cleanup);
          });
        });
      }

      return {
        deps: mounted.deps,
        value: mounted.value,
      };
    }, dependencies) as MoleculeCacheValue;
  }

  function get<T>(m: MoleculeOrInterface<T>, ...scopes: AnyScopeTuple[]): T {
    if (!isMolecule(m) && !isMoleculeInterface(m))
      throw new Error(ErrorInvalidMolecule);
    const bound = getTrueMolecule(m);
    return getInternal(bound, {}, ...scopes).value as T;
  }

  function useScopes(...scopes: AnyScopeTuple[]): [AnyScopeTuple[], Unsub] {
    const subscriptionId = Symbol(Math.random());

    const tuples = leaseScopes(scopes, subscriptionId, scopeCache);
    const unsub = () => unleaseScope(subscriptionId);

    unsubToSubscriptionID.set(unsub, subscriptionId);
    return [tuples, unsub];
  }

  function use<T>(
    m: MoleculeOrInterface<T>,
    ...scopes: AnyScopeTuple[]
  ): [T, Unsub] {
    if (!isMolecule(m) && !isMoleculeInterface(m))
      throw new Error(ErrorInvalidMolecule);

    const [tuples, unsub] = useScopes(...scopes);
    const bound = getTrueMolecule(m);
    const subscriptionId = unsubToSubscriptionID.get(unsub);

    const value = getInternal<T>(bound, { subscriptionId }, ...tuples)
      .value as T;
    return [value, unsub];
  }

  return {
    [TypeSymbol]: Injector,
    get,
    use,
    useScopes,
  };
}

const unsubToSubscriptionID = new WeakMap<Function, Symbol>();

/**
 * Returns the globally defined {@link MoleculeInjector}
 *
 * @returns
 */
export const getDefaultInjector = () => {
  const defaultInjector = (globalThis as any)[DefaultInjector];

  if (defaultInjector === undefined) {
    const newInjector = createInjector();
    (globalThis as any)[DefaultInjector] = newInjector;
    return newInjector;
  }

  if (isInjector(defaultInjector)) {
    return defaultInjector;
  }

  throw new Error(ErrorInvalidGlobalInjector);
};
