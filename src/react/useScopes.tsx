import { useContext, useMemo } from "react";
import { ScopeTuple, getDownstreamScopes } from "../vanilla";
import { ScopeContext } from "./contexts/ScopeContext";
import { useMemoizedScopeTuple } from "./useMemoizedScopeTuple";
import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";

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

  return getDownstreamScopes(parentScopes, memoizedTuple);
}


