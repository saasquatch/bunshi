import type { MoleculeScope } from "./scope";
import type { TupleAndReferences } from "./useMemoizedScopeTuple";

export type ScopeTuple<T> = [MoleculeScope<T>, T];

export type PrimitiveScopeMap = WeakMap<
  AnyMoleculeScope,
  Map<AnyScopeValue, TupleAndReferences>
>;
type AnyMoleculeScope = MoleculeScope<unknown>;
type AnyScopeValue = unknown;
export type AnyScopeTuple = ScopeTuple<unknown>;
