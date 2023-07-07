import { Molecule } from "../vanilla";
import { useScopes } from "./useScopes";
import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { useStore } from "./useStore";

export function useMolecule<T>(
  m: Molecule<T>,
  options?: MoleculeScopeOptions
): T {
  const scopes = useScopes(options);
  const store = useStore();
  return store.get(m, ...scopes);
}
