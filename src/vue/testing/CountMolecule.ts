import { ref } from "vue";
import { createScope, molecule } from "../";
import { createLifecycleUtils } from "../../shared/testing/lifecycle";

export const userScope = createScope<string>("none");

export const lifecycle = createLifecycleUtils();

export const CountMolecule = molecule((_, getScope) => {
  const username = getScope(userScope);
  const count = ref(0);

  lifecycle.connect(username);
  return {
    count,
    username,
  };
});
