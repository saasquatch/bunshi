import { ComponentScope, molecule } from "bunshi";
import { atom, computed } from "nanostores";

export const MultiplierMolecule = molecule(() => atom(0));

export const CountMolecule = molecule((mol, scope) => {
  scope(ComponentScope);

  const countAtom = atom(0);
  const increment = () => countAtom.set(countAtom.get() + 1);

  const valueAtom = computed(
    [mol(MultiplierMolecule), countAtom],
    (mult, count) => mult * count
  );

  return {
    countAtom,
    valueAtom,
    increment,
  };
});
