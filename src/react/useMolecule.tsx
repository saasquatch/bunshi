import { useEffect, useMemo } from "react";
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

  // FIXME: Memoize these so a new handle is only created when the tuples change
  const inputTuples = useScopeTuplesRaw(options);
  const [value, handle] = useMemo(
    () => injector.useLazily(mol, ...inputTuples),
    [mol, injector, flattenTuples(inputTuples)],
  );

  useEffect(() => {
    handle.start();
    return () => {
      handle.stop();
    };
  }, [handle]);

  return value;
}
