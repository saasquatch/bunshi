import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { Molecule } from "../vanilla";
import { useScopes } from "./useScopes";
import { useStore } from "./useStore";

export const useMolecule = <T>(m: Molecule<T>, options?: MoleculeScopeOptions) => {
    const scopes = useScopes(options);
    const store = useStore();
    return store.get(m, ...scopes);
}


