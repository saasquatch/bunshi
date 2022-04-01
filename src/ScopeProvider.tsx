import React, { useContext, useMemo } from "react";
import { createStore, Molecule, MoleculeScope, ScopeTuple } from "./molecule";
import { createMemoizeAtom } from "./weakCache";

export const STORE_CONTEXT = React.createContext(createStore());
STORE_CONTEXT.displayName = "Jotai Molecule Store Context";

export const SCOPE_CONTEXT = React.createContext<ScopeTuple<unknown>[]>([]);
SCOPE_CONTEXT.displayName = "Jotai Molecule Scope Context";

export type ProviderProps<T> = {
  scope: MoleculeScope<T>;
  value: T;
  children?: React.ReactNode;
};

const memoize = createMemoizeAtom();

/**
 * Provides scope for all molecules lower down in the React component tree.
 *
 * Will continue to provide parent scopes down, and either override a scope value or add a new scope.
 *
 * NOTE - This component memoizes scope per provider. So, the followin two `ComponentA` components will have
 * *DIFFERENT* molecules provided to them.
 *
 * <ScopeProvider scope={UserScope} value="a"><ComponentA/></ScopeProvider>
 * <ScopeProvider scope={UserScope} value="a"><ComponentA/></ScopeProvider>
 *
 */
export function ScopeProvider<T>(props: ProviderProps<T>) {
  /**
   * Memoization is important since the store relies
   * on the ScopeTuple being referentially consistent
   *
   * If a new array is provided to the store,
   * then new molecules are created
   */
  const memoizedTuple = useMemo<ScopeTuple<T>>(() => {
    const { value, scope } = props;
    const tuple: ScopeTuple<T> = [scope, value];
    if (typeof value === "object") {
      // If we have an object, we can safely weak cache it.
      return memoize(() => tuple, [scope, value as unknown as object]);
    }
    // Not an object, so we can't safely cache it
    return tuple;
  }, [props.scope, props.value]);
  const parentScopes = useContext(SCOPE_CONTEXT);

  const found = parentScopes.findIndex((scopeTuple) => {
    const scope = scopeTuple[0];
    return scope === props.scope;
  });

  const downstreamScopes =
    found >= 0
      ? // Replace inline (when found)
        [
          ...parentScopes.slice(0, found),
          memoizedTuple,
          ...parentScopes.slice(found, -1),
        ]
      : // Append to the end (when not found)
        [...parentScopes, memoizedTuple];
  return (
    <SCOPE_CONTEXT.Provider value={downstreamScopes}>
      {props.children}
    </SCOPE_CONTEXT.Provider>
  );
}

export function useMolecule<T>(m: Molecule<T>): T {
  const store = useContext(STORE_CONTEXT);
  const scopes = useContext(SCOPE_CONTEXT);
  return store.get(m, ...scopes);
}
