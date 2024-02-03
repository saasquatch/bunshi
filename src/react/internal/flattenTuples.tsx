import { AnyScopeTuple } from "../../vanilla/internal/internal-types";

export function flattenTuples(tuples: AnyScopeTuple[]): unknown[] {
  return tuples.flatMap((t) => t);
}
