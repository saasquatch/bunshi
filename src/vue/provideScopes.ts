import { provide } from "vue";
import type { ScopeTuple } from "../vanilla";
import { ScopeSymbol } from "./internal/symbols";
import { useScopes } from "./useScopes";

/**
 * Provides a scope to children components. Overrides any existing scope of the current value.
 *
 * @param tuple - a scope tuple
 */
export const provideScope = (tuple: ScopeTuple<unknown>) => {
  provide(ScopeSymbol, useScopes({ withScope: tuple }));
};
