import { createScope, molecule } from "bunshi";
import { atom } from "jotai/vanilla";

// FormScope will be used for provided a string value to forms
export const FormScope = createScope("none");

export const CountMolecule = molecule((_, scope) => {
  // Since `scope` is called here, it makes `CountMolecule` scoped to the form
  scope(FormScope);
  return atom(0);
});
