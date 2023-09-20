import { ErrorAsyncGetMol, ErrorAsyncGetScope, ErrorInvalidGlobalInjector, ErrorInvalidMolecule, ErrorInvalidScope, ErrorUnboundMolecule } from "./internal/errors";
import type { AnyMolecule, AnyMoleculeScope, AnyScopeTuple, MoleculeInternal } from "./internal/internal-types";
import { deregisterScopeTuple, registerMemoizedScopeTuple } from "./internal/memoized-scopes";
import { DefaultInjector, GetterSymbol, Injector, TypeSymbol } from "./internal/symbols";
import { isInjector, isMolecule, isMoleculeInterface, isMoleculeScope } from "./internal/utils";
import { createDeepCache } from "./internal/weakCache";
import type { Molecule, MoleculeGetter, MoleculeOrInterface, ScopeGetter } from "./molecule";
import type { BindingMap, Bindings } from "./types";

type Deps = {
  scopes: AnyMoleculeScope[];
  transitiveScopes: AnyMoleculeScope[];
  molecules: AnyMolecule[];
};

type Mounted = {
  deps: Deps;
  value: unknown;
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
  use<T>(molecule: MoleculeOrInterface<T>, ...scopes: AnyScopeTuple[]): [T, Unsub];

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
}

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
export function createInjector(props: CreateInjectorProps = {}): MoleculeInjector {

  /*
  *
  *
  *     State
  * 
  * 
  */
  const moleculeCache = createDeepCache();
  const objectScopeCache = createDeepCache();
  const primitiveScopeCache = new WeakMap();
  const bindings = bindingsToMap(props.bindings);

  /** 
  * Lookup bindings to override a molecule, or throw an error for unbound interfaces
  * 
  */
  function getTrueMolecule<T>(molOrIntf: MoleculeOrInterface<T>): MoleculeInternal<T> {
    const bound = bindings.get(molOrIntf);
    if (bound) return bound as MoleculeInternal<T>;
    if (isMolecule(molOrIntf)) return molOrIntf as MoleculeInternal<T>;

    throw new Error(ErrorUnboundMolecule);
  }

  /**
   * Create a new instance of a molecule
   * 
   */
  function mountMolecule(
    maybeMolecule: AnyMolecule,
    getScopeValue: ScopeGetter,
    scopes: AnyScopeTuple[]
  ): Mounted {
    const m = getTrueMolecule(maybeMolecule);

    const dependentMolecules = new Set<AnyMolecule>();
    const dependentScopes = new Set<AnyMoleculeScope>();
    const transientScopes = new Set<AnyMoleculeScope>();
    let running = true;
    const trackingScopeGetter: ScopeGetter = (s) => {
      if (!running) throw new Error(ErrorAsyncGetScope)
      if (!isMoleculeScope(s)) throw new Error(ErrorInvalidScope)
      dependentScopes.add(s);
      return getScopeValue(s);
    };
    const trackingGetter: MoleculeGetter = (molOrInterface) => {
      if (!running) throw new Error(ErrorAsyncGetMol);
      if (!isMolecule(molOrInterface) && !isMoleculeInterface(molOrInterface)) throw new Error(ErrorInvalidMolecule);

      const dependentMolecule = getTrueMolecule(molOrInterface);
      dependentMolecules.add(dependentMolecule);
      const mol = getInternal(dependentMolecule, ...scopes);
      Array.from(mol.deps.scopes.values()).forEach((s) =>
        transientScopes.add(s)
      );
      Array.from(mol.deps.transitiveScopes).forEach((s) =>
        transientScopes.add(s)
      );
      return mol.value as any;
    };

    const value = m[GetterSymbol](trackingGetter, trackingScopeGetter);
    running = false;
    return {
      deps: {
        molecules: Array.from(dependentMolecules.values()),
        scopes: Array.from(dependentScopes.values()),
        transitiveScopes: Array.from(transientScopes.values()),
      },
      value,
    };
  }

  function getInternal<T>(m: Molecule<T>, ...scopes: AnyScopeTuple[]): Mounted {
    const getScopeValue: ScopeGetter = (scope) => {
      const found = scopes.find(
        (providedScope) => providedScope[0] === scope
      );
      if (found) return found[1] as any;
      return scope.defaultValue;
    };

    const mounted = mountMolecule(m, getScopeValue, scopes);

    const relatedScope = scopes.filter((s) => {
      const scopeKey = s[0];
      return mounted.deps.scopes.includes(scopeKey);
    });

    const transitiveRelatedScope = scopes.filter((s) => {
      const scopeKey = s[0];
      return mounted.deps.transitiveScopes.includes(scopeKey);
    });

    const dependencies = [
      m,
      ...relatedScope,
      ...transitiveRelatedScope,
      ...mounted.deps.molecules,
    ];

    return moleculeCache.deepCache(
      () => mounted,
      dependencies
    );
  }

  function get<T>(m: MoleculeOrInterface<T>, ...scopes: AnyScopeTuple[]): T {
    if (!isMolecule(m) && !isMoleculeInterface(m)) throw new Error(ErrorInvalidMolecule);
    const bound = getTrueMolecule(m);
    return getInternal(bound, ...scopes).value as T;
  }

  function useScopes(...scopes: AnyScopeTuple[]): [AnyScopeTuple[], Unsub] {
    const unsubs = new Set<Unsub>();
    const tuples = scopes.map((tuple) => {

      const uniqueValue = Symbol(Math.random());
      const memoizedTuple = registerMemoizedScopeTuple(tuple, uniqueValue, primitiveScopeCache, objectScopeCache);

      unsubs.add(() => deregisterScopeTuple(tuple, uniqueValue, primitiveScopeCache));

      return memoizedTuple;
    })
    const unsub = () => unsubs.forEach(fn => fn());

    return [tuples, unsub]
  }

  function use<T>(m: MoleculeOrInterface<T>, ...scopes: AnyScopeTuple[]): [T, Unsub] {
    if (!isMolecule(m) && !isMoleculeInterface(m)) throw new Error(ErrorInvalidMolecule);

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

  throw new Error(ErrorInvalidGlobalInjector)
}