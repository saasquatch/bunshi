import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { Molecule } from "../vanilla";
import { useInjector } from "./useInjector";
import { useScopes } from "./useScopes";

export function useMolecule<T>(
  m: Molecule<T>,
  options?: MoleculeScopeOptions
): T {
  const scopes = useScopes(options);
  const injector = useInjector();
  return injector.get(m, ...scopes);
}
