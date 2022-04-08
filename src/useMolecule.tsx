import { useContext } from "react";
import { Molecule } from "./molecule";
import { STORE_CONTEXT, SCOPE_CONTEXT } from "./ScopeProvider";


export function useMolecule<T>(m: Molecule<T>): T {
  const store = useContext(STORE_CONTEXT);
  const scopes = useContext(SCOPE_CONTEXT);
  return store.get(m, ...scopes);
}
