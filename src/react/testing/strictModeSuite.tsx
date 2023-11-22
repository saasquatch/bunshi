import React, { StrictMode } from "react";

// Alternative to strict mode
export function NoOpWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Creates a test suite that tests across both Strict and Non-Strict modes
 *
 * Implementations need to use `wrapper` in their calls to `renderHook`
 * to make sure StrictMode is turned on
 *
 * @param cb - test suite (passed to `describe` from Vitest)
 */
export function strictModeSuite(
  cb: (props: { wrapper: React.FC<{ children: React.ReactNode }> }) => void,
) {
  describe.each([
    { wrapper: NoOpWrapper, case: "Non-Strict Mode" },
    { wrapper: StrictMode, case: "Strict Mode" },
  ])("React $case", cb);
}
