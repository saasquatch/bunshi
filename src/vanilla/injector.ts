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
import { CleanupCallback, MountedCallback, __setImpl } from "./lifecycle";
import type {
  Molecule,
  MoleculeGetter,
  MoleculeOrInterface,
  ScopeGetter,
} from "./molecule";
import type { BindingMap, Bindings } from "./types";

export type TupleAndReferences = {
  references: Set<Symbol>;
  tuple: AnyScopeTuple;
  cleanups: ScopeCleanups;
};

export type PrimitiveScopeMap = WeakMap<
  AnyMoleculeScope,
  Map<unknown, TupleAndReferences>
>;

/**
 * Creates a memoized tuple of `[scope,value]`
 *
 * Registers primitive `value`s in the primitive scope cache. This has side-effects
 * and needs to be cleaned up with `deregisterScopeTuple`
 *
 */
function registerMemoizedScopeTuple<T>(
  tuple: ScopeTuple<T>,
  subscriptionId: Symbol,
  primitiveMap: PrimitiveScopeMap
): ScopeTuple<T> {
  const [scope, value] = tuple;

  // Not an object, so we can't safely cache it in a WeakMap
  let valuesForScope = primitiveMap.get(scope);
  if (!valuesForScope) {
    valuesForScope = new Map();
    primitiveMap.set(scope, valuesForScope);
  }

  let cached = valuesForScope.get(value);
  if (cached) {
    // Increment references
    cached.references.add(subscriptionId);
    return cached.tuple as ScopeTuple<T>;
  }

  const references = new Set<Symbol>();
  references.add(subscriptionId);
  valuesForScope.set(value, {
    references,
    tuple,
    cleanups: new Set(),
  });

  return tuple;
}

/**
 * For values that are "primitive" (not an object),
 * deregisters them from the primitive scope
 * cache to ensure no memory leaks
 */
function deregisterScopeTuples<T>(
  subscriptionId: Symbol,
  primitiveScopeMap: PrimitiveScopeMap,
  cleanupsRun: WeakSet<CleanupCallback>,
  tuples: ScopeTuple<T>[]
) {
  tuples.forEach(([scope, value]) => {
    const scopeMap = primitiveScopeMap.get(scope);
    const cached = scopeMap?.get(value);

    const references = cached?.references;
    references?.delete(subscriptionId);

    if (references && references.size <= 0) {
      scopeMap?.delete(value);

      // Run all cleanups

      cached?.cleanups.forEach((cb) => {
        if (!cleanupsRun.has(cb)) {
          cb();
          cleanupsRun.add(cb);
        }
      });
    }
  });
}

type Deps = {
  scopes: AnyMoleculeScope[];
  transitiveScopes: AnyMoleculeScope[];
  molecules: AnyMolecule[];
};

type Mounted = {
  deps: Deps;
  value: unknown;
  mountedCallbacks: Set<MountedCallback>;
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
  const moleculeCache = createDeepCache<AnyMolecule | AnyScopeTuple, Mounted>();

  const scopeCache: PrimitiveScopeMap = new WeakMap();
  const cleanupsRun = new WeakSet<CleanupCallback>();
  const bindings = bindingsToMap(props.bindings);

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
    getMoleculeValue: (mol: AnyMolecule) => Mounted
  ): Mounted {
    const m = getTrueMolecule(maybeMolecule);

    const dependentMolecules = new Set<AnyMolecule>();
    const dependentScopes = new Set<AnyMoleculeScope>();
    const transientScopes = new Set<AnyMoleculeScope>();
    const trackingScopeGetter: ScopeGetter = (s) => {
      if (!running) throw new Error(ErrorAsyncGetScope);
      if (!isMoleculeScope(s)) throw new Error(ErrorInvalidScope);
      dependentScopes.add(s);
      return getScopeValue(s);
    };
    const trackingGetter: MoleculeGetter = (molOrInterface) => {
      if (!running) throw new Error(ErrorAsyncGetMol);
      if (!isMolecule(molOrInterface) && !isMoleculeInterface(molOrInterface))
        throw new Error(ErrorInvalidMolecule);

      const dependentMolecule = getTrueMolecule(molOrInterface);
      dependentMolecules.add(dependentMolecule);
      const mol = getMoleculeValue(dependentMolecule);
      Array.from(mol.deps.scopes.values()).forEach((s) =>
        transientScopes.add(s)
      );
      Array.from(mol.deps.transitiveScopes).forEach((s) =>
        transientScopes.add(s)
      );
      return mol.value as any;
    };

    const mountedCallbacks = new Set<MountedCallback>();
    __setImpl((fn: MountedCallback) => {
      mountedCallbacks.add(fn);
    });
    let running = true;
    const value = m[GetterSymbol](trackingGetter, trackingScopeGetter);
    running = false;
    __setImpl(undefined);

    return {
      deps: {
        molecules: Array.from(dependentMolecules.values()),
        scopes: Array.from(dependentScopes.values()),
        transitiveScopes: Array.from(transientScopes.values()),
      },
      value,
      mountedCallbacks,
    };
  }

  function getInternal<T>(m: Molecule<T>, ...scopes: AnyScopeTuple[]): Mounted {
    const getScopeValue: ScopeGetter = (scope) => {
      const found = scopes.find((providedScope) => providedScope[0] === scope);
      if (found) return found[1] as any;
      return scope.defaultValue;
    };

    const mounted = runMolecule(m, getScopeValue, (m) =>
      getInternal(m, ...scopes)
    );

    // TODO: How do we cleanup `mounted` if it never makes it into the cache?
    // That's a big question
    // Since molecules can only register their scopes and dependencies when they are called
    // And that's the same time that the component is called
    // Then we need a different lifecycle for "starting" and "ending" vs creating

    const relatedScope = scopes.filter((s) => {
      const scopeKey = s[0];
      return mounted.deps.scopes.includes(scopeKey);
    });

    const transitiveRelatedScope = scopes.filter((s) => {
      const scopeKey = s[0];
      return mounted.deps.transitiveScopes.includes(scopeKey);
    });

    const scopeKeys = [...relatedScope, ...transitiveRelatedScope];
    const dependencies = [
      ...relatedScope,
      ...transitiveRelatedScope,
      ...mounted.deps.molecules,
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

      return mounted;
    }, dependencies) as Mounted;
  }

  function get<T>(m: MoleculeOrInterface<T>, ...scopes: AnyScopeTuple[]): T {
    if (!isMolecule(m) && !isMoleculeInterface(m))
      throw new Error(ErrorInvalidMolecule);
    const bound = getTrueMolecule(m);
    return getInternal(bound, ...scopes).value as T;
  }

  function useScopes(...scopes: AnyScopeTuple[]): [AnyScopeTuple[], Unsub] {
    const subscriptionId = Symbol(Math.random());

    const tuples = scopes.map((tuple) =>
      registerMemoizedScopeTuple(tuple, subscriptionId, scopeCache)
    );
    const unsub = () =>
      deregisterScopeTuples(subscriptionId, scopeCache, cleanupsRun, tuples);

    return [tuples, unsub];
  }

  function use<T>(
    m: MoleculeOrInterface<T>,
    ...scopes: AnyScopeTuple[]
  ): [T, Unsub] {
    if (!isMolecule(m) && !isMoleculeInterface(m))
      throw new Error(ErrorInvalidMolecule);

    const [tuples, unsub] = useScopes(...scopes);
    const value = get<T>(m, ...tuples);
    return [value, unsub];
  }

  return {
    [TypeSymbol]: Injector,
    get,
    use,
    useScopes,
  };
}

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
