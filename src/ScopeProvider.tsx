import React from "react";
import { ScopeContext } from "./contexts/ScopeContext";
import { MoleculeScope } from "./scope";
import { MoleculeScopeOptions, useScopes } from "./useScopes";

export type ProviderProps<T> = {
  scope: MoleculeScope<T>;
  value?: T;
  /**
   * Will generate a unique value, creating a unique separate scope for this provider
   */
  uniqueValue?: boolean;
  children?: React.ReactNode;
};

/**
 * Provides scope for all molecules lower down in the React component tree.
 *
 * Will continue to provide parent scopes down, and either override a scope value or add a new scope.
 *
 */
export function ScopeProvider<T>(props: ProviderProps<T>) {
  const { value, scope, uniqueValue } = props;

  let options: MoleculeScopeOptions;
  if (uniqueValue) {
    options = {
      withUniqueScope: scope,
    };
  } else {
    options = {
      withScope: [scope, value],
    };
  }
  const downstreamScopes = useScopes(options);
  return (
    <ScopeContext.Provider value={downstreamScopes}>
      {props.children}
    </ScopeContext.Provider>
  );
}
