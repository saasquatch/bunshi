import { Atom, atom } from "jotai";
import { molecule, createScope, Molecule, use } from "../../vanilla";
import { createLifecycleUtils } from "./lifecycle";

export type ExampleConfig = {
  example: Atom<string>;
};

export const ConfigScope = createScope<Molecule<ExampleConfig> | undefined>(
  undefined,
);

export const libraryLifecycle = createLifecycleUtils();
export const LibaryMolecule = molecule(() => {
  const configMol = use(ConfigScope)!;
  if (!configMol)
    throw new Error("This molecule requires ConfigScope to function!");

  const config = use(configMol) as ExampleConfig;
  const derivedAtom = atom((get) => get(config.example).toUpperCase());

  libraryLifecycle.connect();
  return {
    ...config,
    derivedAtom,
  };
});

export const configALifecycle = createLifecycleUtils();
export const ConfigAMolecule = molecule<ExampleConfig>(() => {
  configALifecycle.connect();
  return {
    example: atom("Config A"),
  };
});

export const configBLifecycle = createLifecycleUtils();
const ScopeB = createScope("Longer tree");
export const ConfigBMolecule = molecule<ExampleConfig>(() => {
  // This creates a different path for the dependencies of `LibraryMolecule`
  // And can throw errors
  use(ScopeB);
  configBLifecycle.connect();
  return {
    example: atom("Config B"),
  };
});
