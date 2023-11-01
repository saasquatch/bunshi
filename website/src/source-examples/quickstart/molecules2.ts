import { ComponentScope, molecule } from "bunshi";
import { atom } from "jotai/vanilla";

export const CountMolecule = molecule((_, scope) => {
  scope(ComponentScope);
  return atom(0);
});
