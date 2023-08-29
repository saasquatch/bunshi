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
  getter: MoleculeConstructor<T>;
  displayName?: string;
};

export type MoleculeOrKey<T> = MoleculeKey<T> | Molecule<T>;
export type MoleculeKey<T> = {};

export function molecule<T>(getter: MoleculeConstructor<T>): Molecule<T> {
  return {
    getter,
    // @ts-ignore
    [TypeSymbol]: Molecule
  };
}

export function moleculeKey<T>(): MoleculeKey<T> {
  return {
    [TypeSymbol]: MoleculeKey
  };
}

const TypeSymbol = Symbol("Type");
const Molecule = Symbol("Molecule");
const MoleculeKey = Symbol("MoleculeKey");

type AnyMolecule = Molecule<unknown>;

export function isMolecule(value: unknown): value is AnyMolecule {
  if (typeof value !== "object") return false;
  // @ts-ignore
  const type = value[TypeSymbol];
  return type === Molecule;
}

export function isMoleculeKey(value: unknown): value is AnyMolecule {
  if (typeof value !== "object") return false;
  // @ts-ignore
  const type = value[TypeSymbol];
  return type === MoleculeKey;
}