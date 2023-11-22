import { inject, provide } from "vue";
import type { MoleculeInjector, MoleculeInterface } from "../vanilla";
import { getDefaultInjector } from "../vanilla";
import { InjectorSymbol } from "./internal/symbols";

/**
 * Use the {@link MoleculeInjector} in context for the current component.
 *
 * Defaults to the default injector from {@link getDefaultInjector}
 *
 * @returns the injector in context
 */
export const useInjector = () => inject(InjectorSymbol, getDefaultInjector());

/**
 * Provide an injector to children components.
 *
 * This can be useful for testing and libraries to provide or replace an implementation
 * of a {@link MoleculeInterface}.
 *
 * @param injector - the injector to be provided to children components
 */
export const provideInjector = (injector: MoleculeInjector) => {
  provide(InjectorSymbol, injector);
};
