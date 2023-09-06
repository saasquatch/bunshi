import { AnyMolecule } from "../types";
import { MoleculeInterfaceSymbol, MoleculeSymbol, TypeSymbol } from "./symbols";

export function isMolecule(value: unknown): value is AnyMolecule {
  if (!value) return false;
  if (typeof value !== "object") return false;
  const type = (value as any)[TypeSymbol];
  return type === MoleculeSymbol;
}

export function isMoleculeInterface(value: unknown): value is AnyMolecule {
  if (!value) return false;
  if (typeof value !== "object") return false;
  const type = (value as any)[TypeSymbol];
  return type === MoleculeInterfaceSymbol;
}