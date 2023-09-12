export const ErrorAsyncGetMol = "`mol` called asynchronously in a molecule constructor. Make sure your calls are only synchronous.";
export const ErrorAsyncGetScope = "`scope` called asynchronously in a molecule constructor. Make sure your calls are only synchronous.";
export const ErrorUnboundMolecule = `Unbound molecule interface. Could not find a molecule.`;

export const ErrorInvalidScope = "`scope` called with an object that is not a MoleculeScope";
export const ErrorInvalidMolecule = "`mol` called with an object that is not a Molecule or Interface";

export const ErrorInvalidGlobalInjector = "Global namespace conflict. Default injector is not a bunshi injector.";