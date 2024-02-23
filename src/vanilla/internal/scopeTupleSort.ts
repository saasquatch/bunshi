import type { AnyMoleculeScope, AnyScopeTuple } from "./internal-types";
import { SortId } from "./symbols";

export function scopeTupleSort(arr: AnyScopeTuple[]): AnyScopeTuple[] {
  return [...arr].sort((a, b) => compareScopes(a[0], b[0]));
}
function compareScopes(a: AnyMoleculeScope, b: AnyMoleculeScope): number {
  return (a[SortId] as number) - (b[SortId] as number);
}
