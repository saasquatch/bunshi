import { MoleculeInjector } from "../injector";
import { AnyMolecule, AnyMoleculeScope } from "./internal-types";
import { Injector, MoleculeInterfaceSymbol, MoleculeSymbol, ScopeSymbol, TypeSymbol } from "./symbols";

function __isInternalType<T>(value: unknown, typeSymbol: symbol): value is T {
  if (!value) return false;
  if (typeof value !== "object") return false;
  return (value as any)[TypeSymbol] === typeSymbol;
}

export function isMolecule(value: unknown): value is AnyMolecule {
  return __isInternalType(value, MoleculeSymbol);
}

export function isMoleculeScope(value: unknown): value is AnyMoleculeScope {
  return __isInternalType(value, ScopeSymbol);
}

export function isMoleculeInterface(value: unknown): value is AnyMolecule {
  return __isInternalType(value, MoleculeInterfaceSymbol);
}

export function isInjector(value: unknown): value is MoleculeInjector {
  return __isInternalType(value, Injector);
}
