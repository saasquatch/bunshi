import { CreateInjectorProps, createInjector } from "./injector";
import { ErrorInvalidGlobalInjector } from "./internal/errors";
import { DefaultInjector } from "./internal/symbols";
import { isInjector } from "./internal/utils";

/**
 * Returns the globally defined {@link MoleculeInjector}
 *
 * @returns
 */

export const getDefaultInjector = () => {
  const i = (globalThis as any)[DefaultInjector];

  if (i === undefined) {
    const n = createInjector();
    (globalThis as any)[DefaultInjector] = n;
    return n;
  }

  if (isInjector(i)) {
    return i;
  }

  throw new Error(ErrorInvalidGlobalInjector);
};

/**
 * Resets the globally defined default injector
 *
 * Useful for tests
 */
export const resetDefaultInjector = (injectorProps?: CreateInjectorProps) => {
  (globalThis as any)[DefaultInjector] = createInjector(injectorProps);
};
