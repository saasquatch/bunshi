import { ErrorAsyncGetMol, ErrorAsyncGetScope, ErrorUnboundMolecule } from "./errors";
import { deregisterScopeTuple, registerMemoizedScopeTuple } from "./memoized-scopes";
import { Molecule, MoleculeGetter, MoleculeKey, MoleculeOrKey, ScopeGetter, isMolecule, isMoleculeKey } from "./molecule";
import { MoleculeScope } from "./scope";
import { ScopeTuple } from "./types";
import { createDeepCache } from "./weakCache";

type Deps = {
  scopes: AnyScope[];
  transitiveScopes: AnyScope[];
  molecules: AnyMolecule[];
};
type AnyMoleculeKey = MoleculeKey<unknown>;
type AnyMolecule = Molecule<unknown>;
type AnyValue = unknown;
type AnyScope = MoleculeScope<unknown>;
type AnyScopeTuple = ScopeTuple<unknown>;
type Mounted = {
  deps: Deps;
  value: AnyValue;
};
type Unsub = () => unknown;

export type MoleculeStore = {
  /**
   * Get the molecule value for an optional scope. Expects scope tuples to be memoized ahead of time.
   *
   * @param molecule
   * @param scopes
   */
  get<T>(molecule: MoleculeOrKey<T>, ...scopes: AnyScopeTuple[]): T;


  /**
   * Use a molecule, and memoizes scope tuples.
   * 
   * Returns a function to cleanup scope tuples.
   *
   * @param molecule
   * @param scopes
   */
  use<T>(molecule: MoleculeOrKey<T>, ...scopes: AnyScopeTuple[]): [T, Unsub];

  /**
   * Use and memoize scopes.
   * 
   * Returns a function to cleanup scope tuples.
   * 
   * @param scopes 
   */
  useScopes(...scopes: AnyScopeTuple[]): [AnyScopeTuple[], Unsub];

  /**
   * Replace the binding for a molecule. This is not reactive, so won't cause previously created
   * molecules to be re-created.
   * 
   * @param key 
   * @param molecule 
   */
  bind<T>(key: MoleculeKey<T>, molecule: Molecule<T>): void;
};

/**
 * Creates a molecule store.
 *
 * Internally this is just a tree of WeapMaps of WeakMaps
 *
 * @returns
 */
export function createStore(): MoleculeStore {

  const moleculeCache = createDeepCache();
  const scopeCache = createDeepCache();

  const bindings = new Map<AnyMoleculeKey, AnyMolecule>();


  function getTrueMolecule<T>(molOrKey: MoleculeOrKey<T>): Molecule<T> {
    const bound = bindings.get(molOrKey);
    if (bound) return bound as Molecule<T>;

    if (isMolecule(molOrKey)) return molOrKey as Molecule<T>;

    throw new Error(ErrorUnboundMolecule);
  }

  function mountMolecule(
    maybeMolecule: AnyMolecule,
    getScopeValue: ScopeGetter,
    scopes: AnyScopeTuple[]
  ): Mounted {
    const m = getTrueMolecule(maybeMolecule);

    const dependentMolecules = new Set<AnyMolecule>();
    const dependentScopes = new Set<AnyScope>();
    const transientScopes = new Set<AnyScope>();
    let running = true;
    const trackingScopeGetter: ScopeGetter = (s) => {
      if (!running) throw new Error(ErrorAsyncGetScope)
      dependentScopes.add(s);
      return getScopeValue(s);
    };
    const trackingGetter: MoleculeGetter = (molOrKey) => {
      if (!running) throw new Error(ErrorAsyncGetMol)

      const dependentMolecule = getTrueMolecule(molOrKey);
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

    const value = m.getter(trackingGetter, trackingScopeGetter);
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

  function get<T>(m: MoleculeOrKey<T>, ...scopes: AnyScopeTuple[]): T {
    if (!isMolecule(m) && !isMoleculeKey(m)) throw new Error("Expected a molecule or molecule key");
    const bound = getTrueMolecule(m);
    return getInternal(bound, ...scopes).value as T;
  }

  function bind<T>(key: MoleculeKey<T>, molecule: Molecule<T>): void {
    if (!isMolecule(molecule)) throw new Error("Expected a molecule");
    if (!isMolecule(key) && !isMoleculeKey(key)) throw new Error("Expected a molecule or molecule key");
    bindings.set(key, molecule);
  }

  function useScopes(...scopes: AnyScopeTuple[]): [AnyScopeTuple[], Unsub] {
    const unsubs = new Set<Unsub>();
    const tuples = scopes.map((tuple) => {
      
      const uniqueValue = Symbol(Math.random());
      const memoizedTuple = registerMemoizedScopeTuple(tuple, uniqueValue);

      unsubs.add(() => deregisterScopeTuple(tuple, uniqueValue));

      return memoizedTuple;
    })
    const unsub = () => unsubs.forEach(fn => fn());

    return [tuples, unsub]
  }

  function use<T>(m: MoleculeOrKey<T>, ...scopes: AnyScopeTuple[]): [T, Unsub] {
    if (!isMolecule(m) && !isMoleculeKey(m)) throw new Error("Expected a molecule or molecule key");

    const [tuples, unsub] = useScopes(...scopes);
    const value = get<T>(m, ...tuples);
    return [value, unsub];
  }

  return {
    get,
    use,
    useScopes,
    bind
  };
}


export const defaultStore = createStore();