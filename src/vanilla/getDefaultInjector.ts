import { ErrorInvalidGlobalInjector } from "./internal/errors";
import { DefaultInjector } from "./internal/symbols";
import { isInjector } from "./internal/utils";
import { createInjector } from "./injector";

/**
 * Returns the globally defined {@link MoleculeInjector}
 *
 * @returns
 */

export const getDefaultInjector = () => {
  const defaultInjector = (globalThis as any)[DefaultInjector];

  if (defaultInjector === undefined) {
    const newInjector = createInjector();
    (globalThis as any)[DefaultInjector] = newInjector;
    return newInjector;
  }

  if (isInjector(defaultInjector)) {
    return defaultInjector;
  }

  throw new Error(ErrorInvalidGlobalInjector);
};
