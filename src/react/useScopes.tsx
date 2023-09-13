import { useContext, useEffect, useMemo, useRef } from "react";
import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { getDownstreamScopes } from "../shared/getDownstreamScopes";
import { ScopeTuple } from "../vanilla";
import { AnyScopeTuple } from "../vanilla/internal/internal-types";
import { ComponentScope } from "./ComponentScope";
import { ScopeContext } from "./contexts/ScopeContext";
import { useInjector } from "./useInjector";

/**
 * Gets the scopes that are implicitly in context for the current component.
 * 
 * Scopes can also be set and overridden explicitly by passing in options to this hook.
 * 
 * @param options 
 * @returns 
 */
export function useScopes(
  options?: MoleculeScopeOptions
): ScopeTuple<unknown>[] {
  const parentScopes = useContext(ScopeContext);

  const generatedValue = useMemo(
    () => new Error("Do not use this scope value. It is a placeholder only."),
    []
  );

  const componentScopeTuple = useRef([ComponentScope, generatedValue] as const).current as ScopeTuple<unknown>;

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

  const injector = useInjector();

  const [[memoizedTupleOrUndefind], unsub]: [(AnyScopeTuple | undefined)[], Function] = useMemo(() => {
    const handle: ReturnType<typeof injector.useScopes> = tuple ? injector.useScopes(tuple) : [[], () => { }]
    return handle;
  }, tuple);

  useEffect(() => {
    // Cleanup effect
    return () => { unsub() };
  }, [unsub]);


  if (options?.exclusiveScope) {
    /**
     *  Exclusive scopes means ignore scopes from context
     */
    return [memoizedTupleOrUndefind];
  }

  if (!memoizedTupleOrUndefind) {
    /**
     * This is the default case, when we don't have any tuples
     */
    return getDownstreamScopes(parentScopes, componentScopeTuple);
  }

  return getDownstreamScopes(getDownstreamScopes(parentScopes, memoizedTupleOrUndefind as ScopeTuple<unknown>), componentScopeTuple);
}
