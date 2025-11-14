// vite.config.ts
import vue from "@vitejs/plugin-vue";
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
       * To run browser tests, use `vitest --browser=chrome`
       */
      enabled: false,
      /**
       * This is hard-coded as chrome here, but overriden in package.json scripts
       * and github actions. We can still run tests on other browsers
       * with `vitest --browser=chrome`
       */
      name: "chrome",
      provider: "playwright",
      headless: true,
    },
  },
  plugins: [vue()],
});
