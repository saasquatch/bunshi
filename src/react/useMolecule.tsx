import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { MoleculeOrInterface } from "../vanilla";
import { useInjector } from "./useInjector";
import { useScopes } from "./useScopes";

export function useMolecule<T>(
  m: MoleculeOrInterface<T>,
  options?: MoleculeScopeOptions
): T {
  const scopes = useScopes(options);
  const injector = useInjector();
  return injector.get(m, ...scopes);
}
