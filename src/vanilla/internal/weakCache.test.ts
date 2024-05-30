import { createDeepCache } from "./weakCache";

describe("Weak cache", () => {
  it("Caches based on orders of dependencies", () => {
    const memoize = createDeepCache<object, { value: number }>();

    const first = {};
    const second = {};
    let i = 0;
    const fn = () => ({
      value: i++,
    });

    // Same order, so same value
    const firstValue = memoize.deepCache(fn, () => {}, [first, second]);
    const secondValue = memoize.deepCache(fn, () => {}, [first, second]);
    expect(secondValue).toBe(firstValue);

    // Different order, so different values
    const thirdValue = memoize.deepCache(fn, () => {}, [second, first]);
    expect(thirdValue).not.toBe(firstValue);
    expect(thirdValue).not.toBe(secondValue);
  });

  it("Caches based on orders of dependencies", () => {
    const memoize = createDeepCache<object, number>();

    const first = {};
    const fn = (previous?: number) => (previous ? previous + 1 : 1);

    // Same order, so same value
    memoize.upsert(fn, [first]);

    const one = memoize.deepCache(
      () => 0,
      () => {},
      [first],
    );

    memoize.upsert(fn, [first]);

    const two = memoize.deepCache(
      () => 0,
      () => {},
      [first],
    );

    expect(one).toBe(1);
    expect(two).toBe(2);
  });

  describe("Deepest", () => {
    const values: Record<number, symbol> = { [1]: Symbol(1) };
    let i = 0;
    do {
      i += 1;
      values[i] = Symbol(i);
    } while (i < 10);

    type Each = {
      found: number[][];
      search: number[];
      cached: number[][];
    };
    const cases = [
      { cached: [[2, 4]], search: [1, 2, 3, 4], found: [[2, 4]] },
      { cached: [[2, 4]], search: [2, 4], found: [[2, 4]] },
      { cached: [[2, 4]], search: [5, 6, 7], found: [] },
      { cached: [[1]], search: [1, 2, 3], found: [[1]] },
      { cached: [[3]], search: [1, 2, 3], found: [[3]] },
      {
        cached: [
          [2, 4],
          [1, 2],
        ],
        search: [0, 1, 2, 3, 4],
        found: [
          [1, 2],
          [2, 4],
        ],
      },
      { cached: [[2, 3]], search: [1, 2], found: [] },
      { cached: [[2, 3]], search: [3, 4], found: [] },
      { cached: [[2, 3]], search: [1, 2], found: [] },
    ] satisfies Each[];

    test.each(cases)(
      "Search for $search in $cached and should find $found",
      ({ cached, search, found }) => {
        const cache = createDeepCache();

        const symbolized = {
          search: search.map((x) => values[x]),
          found: found.map((x) => x.map((y) => values[y])),
        };

        cached.forEach((entry) => {
          const symbolizedEntries = entry.map((x) => values[x]);
          cache.set(symbolizedEntries, {
            value: Symbol("placeholder value"),
            path: symbolizedEntries,
          });
        });

        const result = cache.find(symbolized.search);
        expect(result.map((x) => x.path)).toStrictEqual(symbolized.found);
      },
    );
  });
});
