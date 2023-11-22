import { ref } from "vue";
import { createScope, molecule } from "../../vanilla";

export const userScope = createScope<string>("none");

export const CountMolecule = molecule((_, getScope) => {
  const username = getScope(userScope);
  const count = ref(0);
  return {
    count,
    username,
  };
});
