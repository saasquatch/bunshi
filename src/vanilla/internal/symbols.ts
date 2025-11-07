// For type inference
export const TypeInferSymbol = Symbol.for("bunshi.molecules.typeInfer");
// For internals
export const InjectorInternalsSymbol = Symbol.for("bunshi.injector.internals");

// For validation
export const TypeSymbol = Symbol.for("bunshi.molecules.type");
export const ScopeSymbol = Symbol.for("bunshi.scope.type");
export const Injector = Symbol.for("bunshi.injector.instance");
export const GetterSymbol = Symbol.for("bunshi.molecules.getter");
export const MoleculeSymbol = Symbol.for("bunshi.molecules.molecule");
export const MoleculeInterfaceSymbol = Symbol.for(
  "bunshi.molecules.molecule.interface",
);

// For globalThis
export const DefaultInjector = Symbol.for(
  "bunshi.injector.defaultGlobalInjector",
);
export const Debug = Symbol("bunshi.debug");
export const SortId = Symbol("bunshi.scope.sort");
