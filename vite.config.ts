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
      ],
      branches: 90,
      lines: 90,
      statements: 90,
      reporter: ["text", "json", "clover", "html"],
    },
  },
  plugins: [vue()],
});
