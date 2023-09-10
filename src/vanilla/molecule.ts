import { MoleculeInterfaceInternal, MoleculeInternal } from "./internal/internal-types";
import { GetterSymbol, MoleculeInterfaceSymbol, MoleculeSymbol, TypeSymbol } from "./internal/symbols";
import { MoleculeScope } from "./scope";

export type ScopeGetter = {
  <Value>(scope: MoleculeScope<Value>): Value;
};

export type MoleculeGetter = {
  <Value>(mol: MoleculeOrInterface<Value>): Value;
};

/**
 * A molecule constructor builds instances of a molecule, similar to how classes work in classic dependency injection.
 * 
 * Any dependencies must be called synchronously in the constructor to be properly registered.
 * 
 */
export type MoleculeConstructor<T> = (
  getMolecule: MoleculeGetter,
  getScope: ScopeGetter
) => T;

export type Molecule<T> = {
  displayName?: string;
} & Record<symbol, unknown>;

export type MoleculeInterface<T> = {
  displayName?: string;
} & Record<symbol, unknown>;

export type MoleculeOrInterface<T> = MoleculeInterface<T> | Molecule<T>;

export function molecule<T>(getter: MoleculeConstructor<T>): Molecule<T> {
  const mol: MoleculeInternal<T> = {
    [GetterSymbol]: getter,
    [TypeSymbol]: MoleculeSymbol
  };
  return mol;
}

export function moleculeInterface<T>(): MoleculeInterface<T> {
  const intf: MoleculeInterfaceInternal<T> = {
    [TypeSymbol]: MoleculeInterfaceSymbol
  };
  return intf;
}


