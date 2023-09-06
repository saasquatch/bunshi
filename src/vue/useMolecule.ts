import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { Molecule } from "../vanilla";
import { useScopes } from "./useScopes";
import { useInjector } from "./useInjector";

export const useMolecule = <T>(m: Molecule<T>, options?: MoleculeScopeOptions) => {
    const scopes = useScopes(options);
    const injector = useInjector();
    return injector.get(m, ...scopes);
}


