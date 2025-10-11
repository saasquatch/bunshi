import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";

export default defineConfig(
  {
    // Global ignores - files/directories to ignore
    ignores: [
      "**/examples/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/website/**",
      "**/coverage/**",
    ],
  },
  // Apply recommended configs
  tseslint.configs.recommended,
  jsdoc.configs["flat/recommended"],
  jsdoc.configs["flat/recommended-typescript"],
  {
    // Configuration for all files
    files: ["**/*.js", "**/*.ts", "**/*.tsx"],
    plugins: { jsdoc },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Disable overly strict JSDoc rules
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/tag-lines": "off",
      // Checks that types in jsdoc comments are defined.
      "jsdoc/no-undefined-types": "error",
      // Add @typeParam tag support
      "jsdoc/check-tag-names": ["warn", { definedTags: ["typeParam"] }],
      // TypeScript unused vars - allow underscore prefix
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Configuration for test files
    files: ["src/**/*.test.{ts,tsx}", "src/**/testing/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    // Configuration for benchmark files
    files: ["src/**/*.bench.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
