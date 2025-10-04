import { renderHook } from "@testing-library/react";
import { StrictMode, useEffect, useMemo, useCallback } from "react";

describe("Strict mode", () => {
  test("Runs `useEffect` twice", () => {
    const runs = vi.fn();
    const cleanups = vi.fn();
    const result = renderHook(
      () => {
        useEffect(() => {
          runs();
          return cleanups;
        }, []);
      },
      { wrapper: StrictMode },
    );
    expect(runs).toBeCalledTimes(2);
    expect(cleanups).toBeCalledTimes(1);
    result.unmount();
    expect(runs).toBeCalledTimes(2);
    expect(cleanups).toBeCalledTimes(2);
  });

  test("useMemo reuses first computation result during double render (React 19)", () => {
    // See https://react.dev/blog/2024/04/25/react-19-upgrade-guide#strict-mode-improvements

    let callCount = 0;
    const computeExpensive = vi.fn(() => ++callCount);

    const { result, rerender } = renderHook(
      () => {
        return useMemo(() => computeExpensive(), []);
      },
      { wrapper: StrictMode },
    );

    // React 19: In Strict Mode, the component renders twice,
    // so useMemo's computation function is called twice during initial mount.
    expect(computeExpensive).toBeCalledTimes(2);
    expect(callCount).toBe(2);

    // IMPORTANT: React 19 uses the result from the FIRST call, not the second
    expect(result.current).toBe(1);

    // Re-render to verify the memoized result is stable
    rerender();
    expect(computeExpensive).toBeCalledTimes(2);
    expect(callCount).toBe(2);
    expect(result.current).toBe(1);
  });

  test("useCallback reuses memoized callback during double render (React 19)", () => {
    const callbackCreation = vi.fn();

    const { result, rerender } = renderHook(
      () => {
        callbackCreation();
        return useCallback(() => "hello", []);
      },
      { wrapper: StrictMode },
    );

    // React 19: Component renders twice in Strict Mode
    expect(callbackCreation).toBeCalledTimes(2);

    const firstCallback = result.current;

    // Re-render to verify callback is stable
    rerender();

    // After rerender, callback should be the same reference
    expect(result.current).toBe(firstCallback);
  });
});
