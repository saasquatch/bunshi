import { Molecule } from "./molecule";
import { MoleculeScopeOptions, useScopes } from "./useScopes";
import { useStore } from "./useStore";

export function useMolecule<T>(
  m: Molecule<T>,
  options?: MoleculeScopeOptions
): T {
  const scopes = useScopes(options);
  const store = useStore();
  return store.get(m, ...scopes);
}
