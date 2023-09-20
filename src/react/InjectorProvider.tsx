import type { MoleculeInjector } from "../vanilla";
import { InjectorContext } from "./contexts/InjectorContext";

/**
 * Provide a {@link MoleculeInjector} in context for children components
 * 
 * This is useful for replacing bindings for testing and libraries.
 * 
 * Note: Every injector is a universe in and of themselves. Nothing is shared between
 * two injectors, so if you replace an injector, you will be replacing all instances
 * of all molecules, so likely replacing the entire state of the running application.
 */
export const InjectorProvider = InjectorContext.Provider