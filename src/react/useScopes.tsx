import { useContext, useEffect, useMemo } from "react";
import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { ScopeTuple, getDownstreamScopes } from "../vanilla";
import { ScopeContext } from "./contexts/ScopeContext";
import { useInjector } from "./useInjector";

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


  if (!tuple) {
    /**
     * This is the default case, when we don't have any tuples
     */
    return parentScopes;
  }

  if (options?.exclusiveScope) {
    /**
     *  Exclusive scopes means ignore scopes from context
     */
    return [options.exclusiveScope];
  }

  const injector = useInjector();
  const [[memoizedTuple], unsub] = useMemo(() => injector.useScopes(tuple), tuple);

  useEffect(() => {
    // Cleanup effect
    return () => { unsub() };
  }, [unsub]);

  return getDownstreamScopes(parentScopes, memoizedTuple as ScopeTuple<unknown>);
}


