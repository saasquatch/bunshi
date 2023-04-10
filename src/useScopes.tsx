import { useContext, useMemo } from "react";
import { ScopeContext } from "./contexts/ScopeContext";
import { MoleculeScope } from "./scope";
import { ScopeTuple } from "./types";
import { useMemoizedScopeTuple } from "./useMemoizedScopeTuple";

export function useScopes(
  options?: MoleculeScopeOptions
): ScopeTuple<unknown>[] {
  const parentScopes = useContext(ScopeContext);

  const generatedValue = useMemo(
    () => new Error("Do not use this scope value. It is a placeholder only."),
    []
  );

  const tuple: ScopeTuple<unknown> | undefined = (() => {
    if (!options) return undefined;
    if (options.withUniqueScope) {
      return [options.withUniqueScope, generatedValue] as ScopeTuple<unknown>;
    }
    if (options.withScope) {
      return options.withScope;
    }
    if (options.exclusiveScope) {
      return options.exclusiveScope;
    }
    return undefined;
  })();

  const memoizedTuple = useMemoizedScopeTuple(tuple);

  if (options?.exclusiveScope) {
    /**
     *  Exclusive scopes means ignore scopes from context
     */
    return [options.exclusiveScope];
  }
  if (!tuple) {
    /**
     * This is the default case, when we don't have any tuples
     */
    return parentScopes;
  }

  const [scope] = tuple;
  const downstreamScopes = useMemo(() => {
    const found = parentScopes.findIndex((scopeTuple) => {
      const foundScope = scopeTuple[0];
      return foundScope === scope;
    });

    return found >= 0
      ? // Replace inline (when found)
        [
          ...parentScopes.slice(0, found),
          memoizedTuple,
          ...parentScopes.slice(found + 1),
        ]
      : // Append to the end (when not found)
        [...parentScopes, memoizedTuple];
  }, [scope, parentScopes, memoizedTuple]);

  return downstreamScopes;
}

export type MoleculeScopeOptions = {
  /**
   * By default {@link useMolecule} will use scopes based on the {@link ScopeContext}
   */
  withScope?: ScopeTuple<unknown>;
  withUniqueScope?: MoleculeScope<unknown>;
  exclusiveScope?: ScopeTuple<unknown>;
};
