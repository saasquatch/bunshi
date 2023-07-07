import { createMemoizeAtom } from "./weakCache";

describe("Weak cache", () => {
  it("order matters", () => {
    const memoize = createMemoizeAtom();

    const first = {};
    const second = {};
    let i = 0;
    const fn = () => ({
      value: i++,
    });

    const firstValue = memoize(fn, [first, second]);
    const secondValue = memoize(fn, [first, second]);
    const thirdValue = memoize(fn, [second, first]);

    expect(secondValue).toBe(firstValue);
    // FIXME: Not getting memoized the way I think it should
    expect(thirdValue).not.toBe(firstValue);
  });
});
