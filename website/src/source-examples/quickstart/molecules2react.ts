import { ComponentScope, molecule } from "bunshi/react";
import { atom } from "jotai/vanilla";

export const CountMolecule = molecule((_, scope) => {
  scope(ComponentScope);
  return atom(0);
});
