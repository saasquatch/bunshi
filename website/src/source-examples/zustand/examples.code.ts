import type { CodeEditorConfig } from "~/components/CodeEditor.types";
import zustand from "./sources";

/**
 * Shared dependencies for Zustand examples
 */
const sharedDependencies = {
  react: {
    zustand: "^4.4",
  },
  vue: {
    zustand: "^4.4",
    "vue-zustand": "^0.6",
  },
};

/**
 * Zustand React example with component-scoped state
 */
export const reactComponentState: CodeEditorConfig = {
  files: {
    "App.tsx": zustand.ReactApp,
    "molecules.ts": {
      code: zustand.molecules2,
      active: true,
    },
  },
  dependencies: sharedDependencies.react,
};

/**
 * Zustand Vue example with component-scoped state
 */
export const vueComponentState: CodeEditorConfig = {
  files: {
    "src/App.vue": zustand.VueApp,
    "src/Counter.vue": zustand.VueCounter,
    "src/molecules.ts": {
      code: zustand.molecules2,
      active: true,
    },
  },
  dependencies: sharedDependencies.vue,
  template: "vite-vue",
};

/**
 * Zustand React example with global state
 */
export const reactGlobalState: CodeEditorConfig = {
  files: {
    "App.tsx": zustand.ReactApp,
    "molecules.ts": {
      code: zustand.molecules,
      active: true,
    },
  },
  dependencies: sharedDependencies.react,
};

/**
 * Zustand Vue example with global state
 */
export const vueGlobalState: CodeEditorConfig = {
  files: {
    "src/App.vue": zustand.VueApp,
    "src/Counter.vue": zustand.VueCounter,
    "src/molecules.ts": {
      code: zustand.molecules,
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
