import React, { useMemo } from "react";
import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { ComponentScope, MoleculeScope } from "../vanilla";
import { ScopeContext } from "./contexts/ScopeContext";
import { useScopes } from "./useScopes";

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
 * Either `value` or `uniqueValue` should be passed as props
 *
 * @typeParam T - the type that should match the {@link MoleculeScope} and the value provided
 */
export function ScopeProvider<T>(
  props: ProviderProps<T>,
): ReturnType<React.FC> {
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

  const simpleDownstreamScopes = useScopes(options);

  // This prevents a new array from being passed downstream on every render
  // in theory this should reduce context re-renders
  const downstreamScopes = useMemo(
    () => simpleDownstreamScopes.filter(([scope]) => scope !== ComponentScope),
    [simpleDownstreamScopes, scope],
  );

  return React.createElement(
    ScopeContext.Provider,
    { value: downstreamScopes },
    props.children,
  );
}
