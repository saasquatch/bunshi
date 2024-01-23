import { ComponentScope, molecule, use } from "bunshi";
import { atom } from "jotai/vanilla";

export const CountMolecule = molecule(() => {
  use(ComponentScope);
  return atom(0);
});
