import React, { useMemo } from "react";
import { useInjector } from "./useInjector";
import { InjectorProvider } from "./InjectorProvider";
import { createInjector } from "../vanilla";
import type { Molecule, MoleculeInterface } from "../vanilla";

export type MoleculeProviderProps<T> = {
  interface: MoleculeInterface<T>;
  value?: Molecule<T> | undefined;
  children?: React.ReactNode;
};

/**
 * Provides the implementation of a molecule interface for all molecules lower down in the React component tree.
 *
 * @param props - the props for the MoleculeProvider component
 * @param props.interface - the molecule interface to provide an implementation for
 * @param props.value - the molecule that implements the interface
 *
 * @typeParam T - the type of object that will be provided by this the molecule interface
 *
 * @example
 * ```tsx
 * import { molecule, moleculeInterface } from "bunshi/vanilla";
 * import { MoleculeProvider, useMolecule } from "bunshi/react";
 *
 * // Define a molecule interface and a component that uses it
 * export const NumberMoleculeInterface = moleculeInterface<number>();
 * function DisplayNumber() {
 *   const number = useMolecule(NumberMoleculeInterface);
 *   return <div>{number}</div>;
 * }
 *
 * // Define a molecule that implements the interface and provides it
 * const RandomNumberMolecule = molecule<number>(() => Math.random());
 * function App() {
 *   return (
 *     <MoleculeProvider interface={NumberMoleculeInterface} value={RandomNumberMolecule}>
 *       <DisplayNumber />
 *     </MoleculeProvider>
 *   );
 * }
 * ```
 */
export function MoleculeProvider<T>(
  props: MoleculeProviderProps<T>,
): ReturnType<React.FC> {
  const { value, interface: moleculeInterface } = props;

  const parentInjector = useInjector();

  const childInjector = useMemo(() => {
    if (value) {
      return createInjector({
        bindings: [[moleculeInterface, value]],
        parent: parentInjector,
      });
    }
    return parentInjector;
  }, [value, moleculeInterface, parentInjector]);

  return React.createElement(
    InjectorProvider,
    { value: () => childInjector },
    props.children,
  );
}
