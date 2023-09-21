import { molecule, useMolecule } from "bunshi/react";

export const ExampleMolecule = molecule(() => {
  return "I am a type test";
});

export const useExample = useMolecule(ExampleMolecule);
