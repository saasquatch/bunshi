import { onMounted, onUnmounted } from "vue";
import type { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import type { MoleculeOrInterface } from "../vanilla";
import { useInjector } from "./useInjector";
import { getTuples } from "./useScopes";

/**
 * Gets an instance of a provided value from a {@link MoleculeOrInterface}
 *
 * @param mol - a molecule that will provided an instance
 * @param options - optional overrides for explicit scoping
 * @returns an instance provided by this molecule
 */
export const useMolecule = <T>(
  mol: MoleculeOrInterface<T>,
  options?: MoleculeScopeOptions,
) => {
  const tuples = getTuples(options);
  const injector = useInjector();

  const [value, handle] = injector.useLazily(mol, ...tuples);

  onMounted(() => {
    handle.start();
  });
  onUnmounted(() => {
    handle.stop();
  });
  return value;
};
