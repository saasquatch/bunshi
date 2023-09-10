import { MoleculeConstructor } from "../molecule";
import { GetterSymbol, TypeSymbol, MoleculeSymbol, MoleculeInterfaceSymbol } from "./symbols";

export type MoleculeInternal<T> = {
    [GetterSymbol]: MoleculeConstructor<T>;
    [TypeSymbol]: typeof MoleculeSymbol;
    displayName?: string;
  };
  
  export type MoleculeInterfaceInternal<T> = {
    [TypeSymbol]: typeof MoleculeInterfaceSymbol;
    displayName?: string;
  };
  