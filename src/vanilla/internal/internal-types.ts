import type { Molecule, MoleculeConstructor, MoleculeInterface } from "../molecule";
import type { MoleculeScope } from "../scope";
import type { ScopeTuple } from "../types";
import { GetterSymbol, MoleculeInterfaceSymbol, MoleculeSymbol, TypeSymbol } from "./symbols";

export * from "../types";

export type AnyMoleculeScope = MoleculeScope<unknown>;
export type AnyScopeTuple = ScopeTuple<unknown>;
export type AnyMolecule = Molecule<unknown>;
export type AnyMoleculeInterface = MoleculeInterface<unknown>;

export type MoleculeInternal<T> = {
  [GetterSymbol]: MoleculeConstructor<T>;
  [TypeSymbol]: typeof MoleculeSymbol;
  displayName?: string;
};

export type MoleculeInterfaceInternal<T> = {
  [TypeSymbol]: typeof MoleculeInterfaceSymbol;
  displayName?: string;
};
