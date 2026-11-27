// vite.config.ts
import vue from "@vitejs/plugin-vue";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "happy-dom",
    globals: true,
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Don't consider test files
        "src/**/*.test.{ts,tsx}",
        // Don't consider code in helper directories
        "src/**/testing/**/*.{ts,tsx}",
        // Don't consider benchmark files
        "src/**/*.bench.{ts,tsx}",
      ],
      thresholds: {
        branches: 90,
        lines: 90,
        statements: 90,
      },
      reporter: ["text", "json", "clover", "html"],
    },
    browser: {
      /**
       * This is intentionally disabled here, but browsers tests
       * can still be run.
       *
       * To run browser tests in one browser, use `vitest --browser=chromium`
       */
      enabled: false,
      provider: playwright(),
      instances: [
        { browser: "chromium" },
        { browser: "firefox" },
        { browser: "webkit" },
      ],
      headless: true,
    },
  },
  plugins: [vue()],
});
