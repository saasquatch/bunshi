import { useContext } from "react";
import { Molecule } from "./molecule";
import { StoreContext, ScopeContext } from "./ScopeProvider";


export function useMolecule<T>(m: Molecule<T>): T {
  const store = useContext(StoreContext);
  const scopes = useContext(ScopeContext);
  return store.get(m, ...scopes);
}
