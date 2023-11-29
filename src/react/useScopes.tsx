import { useContext, useEffect, useMemo, useRef } from "react";
import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { dstream } from "../shared/getDownstreamScopes";
import { ComponentScope, MoleculeOrInterface, ScopeTuple } from "../vanilla";
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
  return useScopeSubscription(options)[0];
}

export function useScopeSubscription(options?: MoleculeScopeOptions) {
  const inputTuples: AnyScopeTuple[] = useScopeTuplesRaw(options);

  const injector = useInjector();

  const result = useMemo(() => {
    let myId = storeID++;
    let cached = undefined as any;
    let superFinalCleanups = new Set<() => {}>();
    return {
      run() {
        console.log(myId, "***Snapshot***");
        if (cached) {
          return cached;
        }
        cached = injector.useScopes(...inputTuples);
        superFinalCleanups.add(cached[1]);
        return cached;
      },
      myId,
      cached,
      superFinalCleanups,
      sub() {
        console.log(myId, "***Subscribe***");
        return () => {
          console.log(myId, "***Unsubscribe***");
          if (cached) {
            console.log("->cleanup", myId);
            superFinalCleanups.delete(cached[1]);
            cached[1]();
          }
        };
      },
    };
  }, flattenTuples(inputTuples));

  // const [_, unsub] = result.run();
  // useEffect(() => {
  //   // Cleanup effect
  //   return () => {
  //     unsub && unsub();
  //   };
  // }, [unsub]);

  useEffect(() => {
    console.log(result.myId, "useEffect");
    result.run();
    return () => {
      console.log(result.myId, "useEffect cleanup");
      result.superFinalCleanups.forEach((cb) => {
        cb();
      });
    };
  }, [result]);

  console.log(result.myId, "*** Render");
  return result.run();
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
function useScopeTuplesRaw(options: MoleculeScopeOptions | undefined) {
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

export function useMolecule2<T>(
  mol: MoleculeOrInterface<T>,
  options?: MoleculeScopeOptions,
): T {
  const rendered = renderCounter++;
  const injector = useInjector();

  // FIXME: Memoize these so a new handle is only created when the tuples change
  const inputTuples = useScopeTuplesRaw(options);
  const [value, handle] = useMemo(
    () => injector.lazyUse(mol, ...inputTuples),
    [mol, injector, flattenTuples(inputTuples)],
  );

  useEffect(() => {
    handle.start();
    return () => {
      handle.stop();
    };
  }, [handle]);

  console.log(rendered, "*** Render");
  // FIXME: Make sure that this doesn't lease anything
  return value;
}

let renderCounter = 1;
let storeID = 1;
function flattenTuples(tuples: AnyScopeTuple[]): unknown[] {
  return tuples.flatMap((t) => t);
}
