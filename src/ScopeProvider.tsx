import React, { useContext, useMemo } from 'react';
import { createStore, Molecule, MoleculeScope, ScopeTuple } from './molecule';

export const STORE_CONTEXT = React.createContext(createStore());
STORE_CONTEXT.displayName = 'Jotai Molecule Store Context';

export const SCOPE_CONTEXT = React.createContext<ScopeTuple<unknown>[]>([]);
SCOPE_CONTEXT.displayName = 'Jotai Molecule Scope Context';

export type ProviderProps<T> = {
  scope: MoleculeScope<T>;
  value: T;
  children?: React.ReactNode;
};

export function ScopeProvider<T>(props: ProviderProps<T>) {
  const memoizedTuple = useMemo<ScopeTuple<T>>(
    () => [props.scope, props.value],
    [props.scope, props.value]
  );
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
