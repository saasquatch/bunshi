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
  options?: MoleculeScopeOptions,
): ScopeTuple<unknown>[] {
  return useScopeSubscription(options).memoizedTuples;
}

export function useScopeSubscription(options?: MoleculeScopeOptions) {
  const parentScopes = useContext(ScopeContext);

  const generatedValue = useMemo(
    () => new Error("Do not use this scope value. It is a placeholder only."),
    [],
  );

  const componentScopeTuple = useRef([ComponentScope, generatedValue] as const)
    .current as ScopeTuple<unknown>;

  const inputTuples: AnyScopeTuple[] = (() => {
    if (!options) return [...parentScopes, componentScopeTuple];
    if (options.withUniqueScope) {
      return getDownstreamScopes(
        getDownstreamScopes(parentScopes, [
          options.withUniqueScope,
          generatedValue,
        ] as ScopeTuple<unknown>),
        componentScopeTuple,
      );
    }
    if (options.withScope) {
      return getDownstreamScopes(
        getDownstreamScopes(parentScopes, options.withScope),
        componentScopeTuple,
      );
    }
    if (options.exclusiveScope) {
      return [options.exclusiveScope, componentScopeTuple];
    }
    return [...parentScopes, componentScopeTuple];
  })();

  const injector = useInjector();

  const [memoizedTuples, unsub, context] = useMemo(
    () => injector.useScopes(...inputTuples),
    flattenTuples(inputTuples),
  );

  useEffect(() => {
    // Cleanup effect
    return () => {
      unsub && unsub();
    };
  }, [unsub]);

  return { memoizedTuples, unsub, context };
}

function flattenTuples(tuples: AnyScopeTuple[]): unknown[] {
  return tuples.flatMap((t) => t);
}
