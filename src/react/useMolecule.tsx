import { useEffect, useMemo, useState } from "react";
import { MoleculeScopeOptions } from "../shared/MoleculeScopeOptions";
import { MoleculeOrInterface } from "../vanilla";
import type { ScopeProvider } from "./ScopeProvider";
import { flattenTuples } from "./internal/flattenTuples";
import { useInjector } from "./useInjector";
import { useScopeTuplesRaw } from "./useScopes";

/**
 * Get an instance from a {@link MoleculeOrInterface}
 *
 * This will use the implicit scope of the component that calls this hook. If the component is wrapped in
 * a {@link ScopeProvider} then that scope will be used here.
 *
 * Scope can also be provided explicitly to this hook. This is useful when you already have access to an ID
 * or other value that represents scope.
 *
 * @param mol - a molecule or interface
 * @param options - allows for setting scope explicitly
 * @typeParam T - the type of the molecule or interface, and the type of interface returned
 * @returns a instance provided by the molecule
 */

export function useMolecule<T>(
  mol: MoleculeOrInterface<T>,
  options?: MoleculeScopeOptions,
): T {
  const injector = useInjector();

  const inputTuples = useScopeTuplesRaw(options);
  const [value, handle] = useMemo(() => {
    // console.log("==== fresh Memo! =====");
    return injector.useLazily(mol, ...inputTuples);
  }, [
    mol,
    injector,
    /**
     * Tuple flattening prevents re-renders unless the number of
     */
    ...flattenTuples(inputTuples),
  ]);

  const [mutableValue, setMutableValue] = useState(() => value);

  useEffect(() => {
    // console.log("==== useEffect! =====");
    const subbedValue = handle.start();
    setMutableValue(() => subbedValue);
    return () => {
      // console.log("==== CLEANUP useEffect! =====");
      handle.stop();
    };
  }, [handle]);

  return mutableValue;
}
