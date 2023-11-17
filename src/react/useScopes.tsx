import { useContext, useEffect, useMemo, useRef } from "react";
import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { getDownstreamScopes } from "../shared/getDownstreamScopes";
import { ComponentScope, ScopeTuple } from "../vanilla";
import { AnyScopeTuple } from "../vanilla/internal/internal-types";
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
  return useScopeSubscription(options).tuples;
}

export function useScopeSubscription(options?: MoleculeScopeOptions): {
  tuples: AnyScopeTuple[];
  subscriptionId?: Symbol;
} {
  const parentScopes = useContext(ScopeContext);

  const generatedValue = useMemo(
    () => new Error("Do not use this scope value. It is a placeholder only."),
    []
  );

  const componentScopeTuple = useRef([ComponentScope, generatedValue] as const)
    .current as ScopeTuple<unknown>;

  const tuples: AnyScopeTuple[] = (() => {
    if (!options) return [...parentScopes, componentScopeTuple];
    if (options.withUniqueScope) {
      return getDownstreamScopes(
        getDownstreamScopes(parentScopes, [
          options.withUniqueScope,
          generatedValue,
        ] as ScopeTuple<unknown>),
        componentScopeTuple
      );
    }
    if (options.withScope) {
      return getDownstreamScopes(
        getDownstreamScopes(parentScopes, options.withScope),
        componentScopeTuple
      );
    }
    if (options.exclusiveScope) {
      return [options.exclusiveScope, componentScopeTuple];
    }
    return [...parentScopes, componentScopeTuple];
  })();

  const injector = useInjector();

  const handle = injector.useScopes(...tuples);

  const unsub = handle[1];

  useEffect(() => {
    // Cleanup effect
    return () => {
      unsub && unsub();
    };
  }, [unsub]);

  return { tuples: handle[0], subscriptionId: handle?.[2]?.subscriptionId };
}
