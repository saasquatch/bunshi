import { ComponentScope, molecule } from "bunshi";
import { computed, ref } from "vue";

export const MultiplierMolecule = molecule(() => ref(0));

export const CountMolecule = molecule((mol, scope) => {
  scope(ComponentScope);

  const countRef = ref(0);

  const multiplierRef = mol(MultiplierMolecule);
  const valueRef = computed(() => countRef.value + multiplierRef.value);

  return {
    countRef,
    valueRef,
  };
});
