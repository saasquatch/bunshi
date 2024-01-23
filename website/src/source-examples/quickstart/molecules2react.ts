import { ComponentScope, molecule, use } from "bunshi/react";
import { atom } from "jotai/vanilla";

export const CountMolecule = molecule(() => {
  use(ComponentScope);
  return atom(0);
});
