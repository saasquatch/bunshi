import type { CodeEditorConfig } from "~/components/CodeEditor.types";
import nanostores from "./sources";

/**
 * Shared dependencies for Nanostores examples
 */
const sharedDependencies = {
  react: {
    nanostores: "^0.9",
    "@nanostores/react": "^0.7",
  },
  vue: {
    nanostores: "^0.9",
    "@nanostores/vue": "^0.10",
  },
};

/**
 * Nanostores React example with component-scoped state
 */
export const reactComponentState: CodeEditorConfig = {
  files: {
    "App.tsx": nanostores.ReactApp,
    "molecules.ts": {
      code: nanostores.molecules2,
      active: true,
    },
  },
  dependencies: sharedDependencies.react,
};

/**
 * Nanostores Vue example with component-scoped state
 */
export const vueComponentState: CodeEditorConfig = {
  files: {
    "src/App.vue": nanostores.VueApp,
    "src/Counter.vue": nanostores.VueCounter,
    "src/Multiplier.vue": nanostores.VueMultiplier,
    "src/molecules.ts": {
      code: nanostores.molecules2,
      active: true,
    },
  },
  dependencies: sharedDependencies.vue,
  template: "vite-vue",
};

/**
 * Nanostores React example with global state
 */
export const reactGlobalState: CodeEditorConfig = {
  files: {
    "App.tsx": nanostores.ReactApp,
    "molecules.ts": {
      code: nanostores.molecules,
      active: true,
    },
  },
  dependencies: sharedDependencies.react,
};

/**
 * Nanostores Vue example with global state
 */
export const vueGlobalState: CodeEditorConfig = {
  files: {
    "src/App.vue": nanostores.VueApp,
    "src/Counter.vue": nanostores.VueCounter,
    "src/Multiplier.vue": nanostores.VueMultiplier,
    "src/molecules.ts": {
      code: nanostores.molecules,
      active: true,
    },
  },
  dependencies: sharedDependencies.vue,
  template: "vite-vue",
};

// Default export for convenience
export default {
  reactComponentState,
  vueComponentState,
  reactGlobalState,
  vueGlobalState,
};
