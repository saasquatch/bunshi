import { ComponentScope, molecule } from "bunshi";
import { derive } from "derive-valtio";
import { proxy } from "valtio/vanilla";

export const MultiplierMolecule = molecule(() => proxy({ count: 0 }));

export const CountMolecule = molecule((mol, scope) => {
  scope(ComponentScope);

  const countProxy = proxy({ count: 0 });
  const increment = () => countProxy.count++;

  const multiplierProxy = mol(MultiplierMolecule);
  const valueProxy = derive({
    value: (get) => get(countProxy).count * get(multiplierProxy).count,
  });

  return {
    countProxy,
    valueProxy,
    increment,
  };
});
