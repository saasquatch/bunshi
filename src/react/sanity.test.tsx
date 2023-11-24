import { renderHook } from "@testing-library/react";
import { StrictMode, useEffect } from "react";

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
});
