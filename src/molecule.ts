import { MoleculeScope } from "./scope";

export type ScopeTuple<T> = [MoleculeScope<T>, T];

export type ScopeGetter = {
  <Value>(scope: MoleculeScope<Value>): Value;
};

export type MoleculeGetter = {
  <Value>(mol: Molecule<Value>): Value;
};

export type Getter<T> = (
  getMolecule: MoleculeGetter,
  getScope: ScopeGetter
) => T;

export type Molecule<T> = {
  getter: Getter<T>;
  displayName?: string;
};

export function molecule<T>(getter: Getter<T>): Molecule<T> {
  return { getter };
}
