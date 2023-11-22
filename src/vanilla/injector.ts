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
import { GetterSymbol, Injector, TypeSymbol } from "./internal/symbols";
import {
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
import { createScoper } from "./scoper";
import type { BindingMap, Bindings, Injectable } from "./types";

type Deps = {
  scopes: Set<AnyMoleculeScope>;
  transitiveScopes: Set<AnyMoleculeScope>;
  defaultScopes: Set<AnyMoleculeScope>;
};

/**
 * The value stored in the molecule cache
 */
type MoleculeCacheValue = {
  deps: Deps;
  value: unknown;
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
   * Use and memoize scopes.
   *
   * Returns a function to cleanup scope tuples.
   *
   * @param scopes
   */
  useScopes(
    ...scopes: AnyScopeTuple[]
  ): [AnyScopeTuple[], Unsub, { subscriptionId: Symbol }];
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

  const dependencyCache: WeakMap<
    AnyMolecule,
    Set<AnyMoleculeScope>
  > = new WeakMap();

  const bindings = bindingsToMap(props.bindings);

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
    context: { subscriptionId?: Symbol },
    ...scopes: AnyScopeTuple[]
  ): MoleculeCacheValue {
    const cachedDeps = dependencyCache.get(m);

    if (cachedDeps) {
      const scopeKeys = scopes
        .filter(([key]) => cachedDeps.has(key))
        .filter(([key, value]) => key.defaultValue !== value);
      const dependencies = [...scopeKeys, m];

      return moleculeCache.deepCache(
        // Not found
        () => runAndCache(m, context, scopes),
        // Found
        (found) => {
          const { subscriptionId } = context;
          if (subscriptionId) {
            // Extend the lease to include the any default scopes
            // that are implicitly leased
            found.deps.defaultScopes.forEach((s) => {
              scoper.leaseScope([s, s.defaultValue], subscriptionId);
            });
          }
        },
        dependencies,
      ) as MoleculeCacheValue;
    }
    return runAndCache<T>(m, context, scopes);
  }

  function runAndCache<T>(
    m: Molecule<T>,
    context: { subscriptionId?: Symbol | undefined },
    scopes: AnyScopeTuple[],
  ) {
    const defaultScopeTuples = new Set<AnyScopeTuple>();

    const getScopeValue = (scope: AnyMoleculeScope): UseScopeDetails => {
      const defaultScopes = new Set<AnyMoleculeScope>();

      const found = scopes.find(([key]) => key === scope);
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

      let defaultTuple: AnyScopeTuple = [scope, scope.defaultValue];

      if (context.subscriptionId) {
        // We generate a lease for this scope
        // for the subscription here to make sure that
        // `onUnmounted` can be used for default scopes
        defaultTuple = scoper.leaseScope(defaultTuple, context.subscriptionId);
      } else {
        console.warn("Default subscription not leased!");
      }

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
      (m) => getInternal(m, context, ...scopes),
      getTrueMolecule,
    );

    const relatedScope = scopes.filter(([key]) => mounted.deps.scopes.has(key));

    const transitiveRelatedScope = scopes.filter(([key]) =>
      mounted.deps.transitiveScopes.has(key),
    );

    const scopeKeySet = dependencyCache.get(m) ?? new Set<AnyMoleculeScope>();
    mounted.deps.scopes.forEach((s) => scopeKeySet.add(s));
    mounted.deps.transitiveScopes.forEach((s) => scopeKeySet.add(s));
    dependencyCache.set(m, scopeKeySet);

    const scopeKeys: AnyScopeTuple[] = [
      ...relatedScope,
      ...transitiveRelatedScope,
      ...Array.from(defaultScopeTuples.values()),
    ];
    const scopeCacheKeys: AnyScopeTuple[] = [
      ...relatedScope,
      ...transitiveRelatedScope,
    ].filter(([key, value]) => key.defaultValue !== value);
    const dependencies = [...scopeCacheKeys, m];

    return moleculeCache.deepCache(
      () => {
        // No molecule exists, so mount a new one
        if (mounted.mountedCallbacks.size > 0) {
          if (scopeKeys.length <= 0)
            throw new Error(
              "Can't use mount lifecycle in globally scoped molecules.",
            );

          const cleanupSet = new Set<CleanupCallback>();
          mounted.mountedCallbacks.forEach((onMount) => {
            // Call all the mount functions for the molecule
            const cleanup = onMount();

            // Queues up the cleanup functions for later
            if (cleanup) cleanupSet.add(cleanup);
          });

          scoper.registerCleanups(scopeKeys, cleanupSet);
        } else {
          // No lifecycle callbacks to run
        }

        return {
          deps: mounted.deps,
          value: mounted.value,
        };
      },
      (found) => {
        const { subscriptionId } = context;
        if (subscriptionId) {
          // Extend the lease to include the any default scopes
          // that are implicitly leased
          found.deps.defaultScopes.forEach((s) => {
            scoper.leaseScope([s, s.defaultValue], subscriptionId);
          });
        }
      },
      dependencies,
    ) as MoleculeCacheValue;
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
      // 2nd param is undefined
      // Molecules used without scopes or subscription
      return getInternal(bound, {}, ...scopes).value as T;
    } else if (Array.isArray(contextOrScope)) {
      const [key] = contextOrScope;
      if (!isMoleculeScope(key))
        throw new Error("Invalid molecule scope used.");
      // 2nd param is a scope
      // Molecule used without a context
      return getInternal(bound, {}, contextOrScope as AnyScopeTuple, ...scopes)
        .value as T;
    }
    // 3nd param is context
    // Extract subscription ID
    return getInternal(bound, contextOrScope as any, ...scopes).value as T;
  }

  function use<T>(
    m: MoleculeOrInterface<T>,
    ...scopes: AnyScopeTuple[]
  ): [T, Unsub, { subscriptionId: Symbol }] {
    if (!isMolecule(m) && !isMoleculeInterface(m))
      throw new Error(ErrorInvalidMolecule);

    const [tuples, unsub, { subscriptionId }] = scoper.useScopes(...scopes);
    const bound = getTrueMolecule(m);

    const value = getInternal<T>(bound, { subscriptionId }, ...tuples)
      .value as T;
    return [value, unsub, { subscriptionId }];
  }

  return {
    [TypeSymbol]: Injector,
    get,
    use,
    useScopes: scoper.useScopes,
  };
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
  const dependentScopes = new Set<AnyMoleculeScope>();
  const transitiveScopes = new Set<AnyMoleculeScope>();
  const transitiveDefaultScopes = new Set<AnyMoleculeScope>();

  const use: InternalUse = (dep: Injectable<unknown>) => {
    if (isMoleculeScope(dep)) {
      dependentScopes.add(dep);
      const scopeDetails = getScopeValue(dep);
      scopeDetails.defaultScopes.forEach((s) => transitiveDefaultScopes.add(s));
      return scopeDetails.value;
    }
    if (isMolecule(dep) || isMoleculeInterface(dep)) {
      const dependentMolecule = getTrueMolecule(dep);
      dependentMolecules.add(dependentMolecule);
      const mol = getMoleculeValue(dependentMolecule);
      mol.deps.scopes.forEach((s) => transitiveScopes.add(s));
      mol.deps.transitiveScopes.forEach((s) => transitiveScopes.add(s));
      mol.deps.defaultScopes.forEach((s) => {
        transitiveDefaultScopes.add(s);
      });
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
      transitiveScopes,
      defaultScopes: transitiveDefaultScopes,
    },
    value,
    mountedCallbacks,
  };
}
