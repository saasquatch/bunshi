import { atom } from "nanostores";
import { molecule } from "bunshi/vue";

export const countMolecule = molecule(() => {
  const countAtom = atom(0);
  return {
    countAtom,
  };
});
