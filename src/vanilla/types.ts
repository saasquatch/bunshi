import type { Molecule, MoleculeInterface, MoleculeOrInterface } from "./molecule";
import type { MoleculeScope } from "./scope";

export type ScopeTuple<T> = [MoleculeScope<T>, T];

export type AnyMoleculeScope = MoleculeScope<unknown>;
export type AnyScopeValue = unknown;
export type AnyScopeTuple = ScopeTuple<unknown>;
export type AnyMolecule = Molecule<unknown>;
export type AnyMoleculeInterface = MoleculeInterface<unknown>;

export type BindingTuple<T> = [MoleculeOrInterface<T>, Molecule<T>];
export type BindingTuples = Array<BindingTuple<unknown>>;
export type BindingMap = Map<MoleculeOrInterface<unknown>, Molecule<unknown>>;
export type Bindings = BindingTuples | BindingMap;