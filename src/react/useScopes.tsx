import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { dstream } from "../shared/getDownstreamScopes";
import { ComponentScope, ScopeTuple } from "../vanilla";
import { AnyScopeTuple } from "../vanilla/internal/internal-types";
import { ScopeContext } from "./contexts/ScopeContext";
import { flattenTuples } from "./internal/flattenTuples";
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
  const inputTuples: AnyScopeTuple[] = useScopeTuplesRaw(options);

  const injector = useInjector();

  const flattened = flattenTuples(inputTuples);

  const sub = useMemo(() => {
    const innerSub = injector.createSubscription();
    innerSub.expand(inputTuples);
    return innerSub;
  }, [injector, ...flattened]);

  const [tuples, setTuples] = useState(sub.tuples);

  useEffect(() => {
    const subbedTuples = sub.start();
    setTuples(subbedTuples);
    return () => {
      sub.stop();
    };
  }, [sub, setTuples]);

  return useMemo(() => tuples, flattened);
}

/**
 * Just create a (non-memoized) set of scope tuples from options
 * and context and returns them.
 *
 * Since this return an array that is NOT memoized, it is not appropriate
 * to use with `injector.get`
 *
 * @param options
 * @returns
 */
export function useScopeTuplesRaw(options?: MoleculeScopeOptions) {
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
      return dstream(
        dstream(parentScopes, [
          options.withUniqueScope,
          generatedValue,
        ] as ScopeTuple<unknown>),
        componentScopeTuple,
      );
    }
    if (options.withScope) {
      return dstream(
        dstream(parentScopes, options.withScope),
        componentScopeTuple,
      );
    }
    if (options.exclusiveScope) {
      return [options.exclusiveScope, componentScopeTuple];
    }
    return [...parentScopes, componentScopeTuple];
  })();

  return inputTuples;
}
