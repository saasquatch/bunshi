import { createScope } from "../../vanilla";
import { flattenTuples } from "./flattenTuples";

test("It flattent tuples", () => {
  const scope1 = createScope("one");
  const scope2 = createScope("two");
  const result = flattenTuples([scope1.defaultTuple, scope2.defaultTuple]);

  expect(result).toStrictEqual([
    scope1,
    scope1.defaultValue,
    scope2,
    scope2.defaultValue,
  ]);
});
