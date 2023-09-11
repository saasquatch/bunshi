import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { MoleculeOrInterface } from "../vanilla";
import { useInjector } from "./useInjector";
import { useScopes } from "./useScopes";

export const useMolecule = <T>(m: MoleculeOrInterface<T>, options?: MoleculeScopeOptions) => {
    const scopes = useScopes(options);
    const injector = useInjector();
    return injector.get(m, ...scopes);
}


