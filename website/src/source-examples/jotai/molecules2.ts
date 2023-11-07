import { ComponentScope, molecule } from "bunshi";
import { atom } from "jotai/vanilla";

export const MultiplierMolecule = molecule(() => atom(0));

export const CountMolecule = molecule((mol, scope) => {
  scope(ComponentScope);

  const countAtom = atom(0);

  const multiplierAtom = mol(MultiplierMolecule);
  const valueAtom = atom((get) => get(countAtom) * get(multiplierAtom));

  return {
    countAtom,
    valueAtom,
  };
});
