import { Molecule, MoleculeGetter, ScopeGetter } from "./molecule";
import { MoleculeScope } from "./scope";
import { ScopeTuple } from "./types";
import { createMemoizeAtom } from "./weakCache";

type Deps = {
  scopes: AnyScope[];
  transitiveScopes: AnyScope[];
  molecules: AnyMolecule[];
};
type AnyMolecule = Molecule<unknown>;
type AnyValue = unknown;
type AnyScope = MoleculeScope<unknown>;
type AnyScopeTuple = ScopeTuple<unknown>;
type Mounted = {
  deps: Deps;
  value: AnyValue;
};

export type MoleculeStore = {
  /**
   * Get the molecule value for an optional scope
   *
   * @param molecule
   * @param scopes
   */
  get<T>(molecule: Molecule<T>, ...scopes: AnyScopeTuple[]): T;
};

/**
 * Creates a molecule store.
 *
 * Internally this is just a tree of WeapMaps of WeakMaps
 *
 * @returns
 */
export function createStore(): MoleculeStore {
  const deepCache = createMemoizeAtom();

  function mountMolecule(
    m: AnyMolecule,
    getScopeValue: ScopeGetter,
    scopes: AnyScopeTuple[]
  ): Mounted {
    const dependentMolecules = new Set<AnyMolecule>();
    const dependentScopes = new Set<AnyScope>();
    const transientScopes = new Set<AnyScope>();
    const trackingScopeGetter: ScopeGetter = (s) => {
      dependentScopes.add(s);
      return getScopeValue(s);
    };
    const trackingGetter: MoleculeGetter = (m) => {
      dependentMolecules.add(m);
      const mol = getInternal(m, ...scopes);
      Array.from(mol.deps.scopes.values()).forEach((s) =>
        transientScopes.add(s)
      );
      Array.from(mol.deps.transitiveScopes).forEach((s) =>
        transientScopes.add(s)
      );
      return mol.value as any;
    };

    const value = m.getter(trackingGetter, trackingScopeGetter);
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
    return deepCache(() => {
      const getScopeValue: ScopeGetter = (scope) => {
        const found = scopes.find(
          (providedScope) => providedScope[0] === scope
        );
        if (found) return found[1] as any;
        return scope.defaultValue;
      };

      const mounted = mountMolecule(m, getScopeValue, scopes);

      const relatedScopes = scopes.filter((s) => {
        const scope = s[0];
        return mounted.deps.scopes.includes(scope);
      });

      const transitiveRelatedScopes = scopes.filter((s) => {
        const scope = s[0];
        return mounted.deps.transitiveScopes.includes(scope);
      });

      return deepCache(
        () => mounted,
        [
          m,
          ...relatedScopes,
          ...transitiveRelatedScopes,
          ...mounted.deps.molecules,
        ]
      );
    }, [m, ...scopes]);
  }

  function get<T>(m: Molecule<T>, ...scopes: AnyScopeTuple[]): T {
    return getInternal(m, ...scopes).value as T;
  }
  return {
    get,
  };
}


export const defaultStore = createStore();