import { AnyScopeTuple } from "./types";


export type TupleAndReferences = {
  references: Set<Symbol>;
  tuple: AnyScopeTuple;
};
