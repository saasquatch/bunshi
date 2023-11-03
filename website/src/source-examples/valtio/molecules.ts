import { molecule } from "bunshi";
import { proxy } from "valtio/vanilla";
import { derive } from 'derive-valtio'

export const MultiplierMolecule = molecule(() => proxy({ count: 0 }));

export const CountMolecule = molecule((mol, scope) => {
  const countProxy = proxy({ count: 0 });
  const increment = () => countProxy.count++

  const multiplierProxy = mol(MultiplierMolecule);
  const valueProxy = derive({
    value: (get) => get(countProxy).count * get(multiplierProxy).count,
  })

  return {
    countProxy,
    valueProxy,
    increment,
  };
});
