import type { MountedCallback } from "../lifecycle";
import type {
  Molecule,
  MoleculeConstructor,
  MoleculeInterface,
} from "../molecule";
import type { MoleculeScope } from "../scope";
import type { ScopeTuple } from "../types";
import {
  GetterSymbol,
  MoleculeInterfaceSymbol,
  MoleculeSymbol,
  TypeSymbol,
} from "./symbols";

/**
 * The value stored in the molecule cache
 */
export type MoleculeCacheValue = {
  deps: Deps;
  value: unknown;
  isMounted: boolean;
  path: (AnyScopeTuple | AnyMolecule)[];
  instanceId: symbol;
};

type Deps = {
  allScopes: Set<AnyMoleculeScope>;
  defaultScopes: Set<AnyMoleculeScope>;
  mountedCallbacks: Set<MountedCallback>;
  // Dependencies
  buddies: MoleculeCacheValue[];
};

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
