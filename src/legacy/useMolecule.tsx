import { Molecule } from "./molecule";
import { MoleculeScopeOptions } from "./MoleculeScopeOptions";

export function useMolecule<T>(
  m: Molecule<T>,
  options?: MoleculeScopeOptions
): T {
  // const scopes = useScopes(options);
  // const store = useStore();
  return {} as T;
}
