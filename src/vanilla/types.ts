import type { Molecule, MoleculeOrInterface } from "./molecule";
import type { MoleculeScope } from "./scope";

export type ScopeTuple<T> = readonly [MoleculeScope<T>, T];
export type BindingTuple<T> = readonly [MoleculeOrInterface<T>, Molecule<T>];
export type BindingTuples = Array<BindingTuple<unknown>>;
export type BindingMap = Map<MoleculeOrInterface<unknown>, Molecule<unknown>>;
export type Bindings = BindingTuples | BindingMap;

export type Injectable<T> = MoleculeOrInterface<T> | MoleculeScope<T>;
