import {
  Molecule,
  MoleculeScope,
  molecule,
  createScope as newCreateScope,
} from "bunshi";
import { MoleculeScopeOptions, ScopeProvider, useMolecule } from "bunshi/react";

export function createScope<T = undefined>(): MoleculeScope<undefined>;
export function createScope<T>(defaultValue: T): MoleculeScope<T>;

export function createScope(defaultValue?: unknown): MoleculeScope<unknown> {
  return newCreateScope(defaultValue);
}

export {
  Molecule,
  MoleculeScope,
  MoleculeScopeOptions,
  ScopeProvider,
  molecule,
  useMolecule,
};
