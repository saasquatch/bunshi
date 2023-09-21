import { molecule, useMolecule } from "bunshi/vue";

export const ExampleMolecule = molecule(() => {
  return "I am a type test";
});

export const useExample = useMolecule(ExampleMolecule);
