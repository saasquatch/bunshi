import React, { createContext } from "react";
import { MoleculeScope } from "./scope";

export type ProviderProps<T> = {
  scope: MoleculeScope<T>;
  value?: T;
  /**
   * Will generate a unique value, creating a unique separate scope for this provider
   */
  uniqueValue?: boolean;
  children?: React.ReactNode;
};

const FakeContext = createContext<any>(undefined);

/**
 * Provides scope for all molecules lower down in the React component tree.
 *
 * Will continue to provide parent scopes down, and either override a scope value or add a new scope.
 *
 */
export function ScopeProvider<T>(props: ProviderProps<T>) {
  return (
    <FakeContext.Provider value={props}>{props.children}</FakeContext.Provider>
  );
}
