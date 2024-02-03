import { getDefaultInjector } from "./getDefaultInjector";
import { ErrorInvalidGlobalInjector } from "./internal/errors";
import { DefaultInjector } from "./internal/symbols";

describe("Global injector", () => {
  test("It always returns the same injector", () => {
    (globalThis as any)[DefaultInjector] = undefined;

    const one = getDefaultInjector();
    const two = getDefaultInjector();

    expect(one).toBe(two);

    (globalThis as any)[DefaultInjector] = undefined;

    const three = getDefaultInjector();
    expect(three).not.toBe(two);
  });

  test("It returns different objects if the global scope is nulled out", () => {
    (globalThis as any)[DefaultInjector] = undefined;
    const one = getDefaultInjector();

    (globalThis as any)[DefaultInjector] = undefined;
    const two = getDefaultInjector();
    expect(one).not.toBe(two);
  });

  test("It throws errors when global scoped is poluted with garbage", () => {
    // Pollute global scope with garbage
    (globalThis as any)[DefaultInjector] = {
      "I am a lot of": "Terrible garbage",
    };

    expect(getDefaultInjector).toThrow(ErrorInvalidGlobalInjector);

    // Cleanup garbage
    (globalThis as any)[DefaultInjector] = undefined;
  });
});
