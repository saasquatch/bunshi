import React, { StrictMode } from "react";

// Alternative to strict mode
export function NoOpWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Creates a test suite that tests across both Strict and Non-Strict modes
 *
 * Implementations need to use `wrapper` in their calls to `renderHook`
 * to make sure StrictMode is turned out
 *
 * @param cb
 */
export function strictModeSuite(
  cb: ({
    wrapper,
  }: {
    wrapper: React.FC<{ children: React.ReactNode }>;
  }) => void
) {
  describe.each([
    { wrapper: NoOpWrapper, case: "Non-Strict Mode" },
    { wrapper: StrictMode, case: "Strict Mode" },
  ])("React $case", cb);
}
