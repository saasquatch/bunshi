import { Atom, atom } from "jotai";
import { molecule, createScope, Molecule, use } from "../../vanilla";

export type ExampleConfig = {
  example: Atom<string>;
};

export const ConfigMolecule = molecule<ExampleConfig>(() => {
  return {
    example: atom("example"),
  };
});

export const ConfigScope = createScope<Molecule<ExampleConfig> | undefined>(
  undefined,
);

export const LibaryMolecule = molecule(() => {
  const configMol = use(ConfigScope);
  if (!configMol)
    throw new Error("This molecule requires ConfigScope to function!");

  const config = use(configMol) as ExampleConfig;
  const derivedAtom = atom((get) => get(config.example).toUpperCase());

  return {
    ...config,
    derivedAtom,
  };
});

const ScopeB = createScope("Longer tree");
export const ConfigAMolecule = molecule<ExampleConfig>(() => {
  return {
    example: atom("Config A"),
  };
});
export const ConfigBMolecule = molecule<ExampleConfig>(() => {
  // This creates a different path for the dependencies of `LibraryMolecule`
  // And can throw errors
  use(ScopeB);
  return {
    example: atom("Config B"),
  };
});
