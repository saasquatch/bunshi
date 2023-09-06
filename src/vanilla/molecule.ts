import { GetterSymbol, MoleculeSymbol, MoleculeKeySymbol, TypeSymbol } from "./internal/symbols";
import { MoleculeScope } from "./scope";

export type ScopeGetter = {
  <Value>(scope: MoleculeScope<Value>): Value;
};

export type MoleculeGetter = {
  <Value>(mol: MoleculeOrKey<Value>): Value;
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
  [GetterSymbol]: MoleculeConstructor<T>;
  [TypeSymbol]: typeof MoleculeSymbol;
  displayName?: string;
};

export type MoleculeOrKey<T> = MoleculeKey<T> | Molecule<T>;
export type MoleculeKey<T> = {};

export function molecule<T>(getter: MoleculeConstructor<T>): Molecule<T> {
  return {
    [GetterSymbol]: getter,
    [TypeSymbol]: MoleculeSymbol
  };
}

export function moleculeKey<T>(): MoleculeKey<T> {
  return {
    [TypeSymbol]: MoleculeKeySymbol
  };
}


