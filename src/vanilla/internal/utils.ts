import { AnyMolecule } from "../types";
import { MoleculeSymbol, MoleculeKeySymbol, TypeSymbol } from "./symbols";

export function isMolecule(value: unknown): value is AnyMolecule {
  if (!value) return false;
  if (typeof value !== "object") return false;
  const type = (value as any)[TypeSymbol];
  return type === MoleculeSymbol;
}

export function isMoleculeKey(value: unknown): value is AnyMolecule {
  if (!value) return false;
  if (typeof value !== "object") return false;
  const type = (value as any)[TypeSymbol];
  return type === MoleculeKeySymbol;
}