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
});
