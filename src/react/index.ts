export { type MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";

export * from "../vanilla";

// Basic API
export {
  ScopeProvider,
  type ProviderProps,
  type ScopeProviderProps,
} from "./ScopeProvider";
export { useMolecule } from "./useMolecule";

// Advanced API - scopes
export { useScopes } from "./useScopes";

// Advanced API - injectors
export { InjectorProvider } from "./InjectorProvider";
export { useInjector } from "./useInjector";

// Advanced API - molecule interfaces provider
export {
  MoleculeProvider,
  type MoleculeProviderProps,
} from "./MoleculeProvider";
