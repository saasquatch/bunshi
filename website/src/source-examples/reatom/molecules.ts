import { molecule } from "bunshi";
import { atom, action } from "@reatom/core";

export const MultiplierMolecule = molecule(() => ({
  multiplierAtom: atom(0, "multiplier"),
}));

export const CountMolecule = molecule((mol, scope) => {
  const countAtom = atom(0, "countAtom");
  const increment = action(
    (ctx) => countAtom(ctx, (count) => count + 1),
    "increment",
  );

  const { multiplierAtom } = mol(MultiplierMolecule);

  const valueAtom = atom((ctx) => {
    return ctx.spy(countAtom) * ctx.spy(multiplierAtom);
  }, "valueAtom");

  return {
    countAtom,
    valueAtom,
    increment,
  };
});
