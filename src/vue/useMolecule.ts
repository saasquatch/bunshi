import { Molecule } from "../vanilla";
import { useStore } from "./useStore";

export const useMolecule = <T>(mol: Molecule<T>) => {
    const store = useStore();
    const value = store.get(mol);
    return value;
}