import type { MoleculeScope } from "./scope";

export type ScopeTuple<T> = [MoleculeScope<T>, T];

export type TupleAndReferences = {
  references: Set<Symbol>;
  tuple: AnyScopeTuple;
};

export type PrimitiveScopeMap = WeakMap<
  AnyMoleculeScope,
  Map<AnyScopeValue, TupleAndReferences>
>;
type AnyMoleculeScope = MoleculeScope<unknown>;
type AnyScopeValue = unknown;
export type AnyScopeTuple = ScopeTuple<unknown>;
