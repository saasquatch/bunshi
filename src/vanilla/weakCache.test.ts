import { createDeepCache } from "./weakCache";

describe("Weak cache", () => {
  it("order matters", () => {
    const memoize = createDeepCache();

    const first = {};
    const second = {};
    let i = 0;
    const fn = () => ({
      value: i++,
    });

    // Same order, so same value
    const firstValue = memoize.deepCache(fn, [first, second]);
    const secondValue = memoize.deepCache(fn, [first, second]);
    expect(secondValue).toBe(firstValue);

    // Different order, so different values
    const thirdValue = memoize.deepCache(fn, [second, first]);
    expect(thirdValue).not.toBe(firstValue);
    expect(thirdValue).not.toBe(secondValue);
  });
});
