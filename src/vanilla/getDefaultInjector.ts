import {
  type CreateInjectorProps,
  type MoleculeInjector,
  createInjector,
} from "./injector";
import { ErrorInvalidGlobalInjector } from "./internal/errors";
import { DefaultInjector } from "./internal/symbols";
import { isInjector } from "./internal/utils";

type GlobalThis = typeof globalThis & {
  [DefaultInjector]?: MoleculeInjector;
};

/**
 * Returns the globally defined {@link MoleculeInjector}
 */
export const getDefaultInjector = () => {
  const i = (globalThis as GlobalThis)[DefaultInjector];

  if (i === undefined) {
    const n = createInjector();
    (globalThis as GlobalThis)[DefaultInjector] = n;
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
  (globalThis as GlobalThis)[DefaultInjector] = createInjector(injectorProps);
};
