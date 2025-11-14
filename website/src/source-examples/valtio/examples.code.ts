import type { CodeEditorConfig } from "~/components/CodeEditor.types";
import valtio from "./sources";

/**
 * Shared dependencies for Valtio examples
 */
const sharedDependencies = {
  react: {
    valtio: "^1.12",
    "derive-valtio": "0.1",
  },
  vue: {
    valtio: "^1.12",
    "derive-valtio": "0.1",
    "@nanostores/vue": "^0.10",
  },
};

/**
 * Valtio React example with component-scoped state
 */
export const reactComponentState: CodeEditorConfig = {
  files: {
    "App.tsx": valtio.ReactApp,
    "molecules.ts": {
      code: valtio.molecules2,
      active: true,
    },
  },
  dependencies: sharedDependencies.react,
};

/**
 * Valtio Vue example with component-scoped state
 */
export const vueComponentState: CodeEditorConfig = {
  files: {
    "src/App.vue": valtio.VueApp,
    "src/Counter.vue": valtio.VueCounter,
    "src/Multiplier.vue": valtio.VueMultiplier,
    "src/useProxy.ts": valtio.useProxy,
    "src/molecules.ts": {
      code: valtio.molecules2,
      active: true,
    },
  },
  dependencies: sharedDependencies.vue,
  template: "vite-vue",
};

/**
 * Valtio React example with global state
 */
export const reactGlobalState: CodeEditorConfig = {
  files: {
    "App.tsx": valtio.ReactApp,
    "molecules.ts": {
      code: valtio.molecules,
      active: true,
    },
  },
  dependencies: sharedDependencies.react,
};

/**
 * Valtio Vue example with global state
 */
export const vueGlobalState: CodeEditorConfig = {
  files: {
    "src/App.vue": valtio.VueApp,
    "src/Counter.vue": valtio.VueCounter,
    "src/Multiplier.vue": valtio.VueMultiplier,
    "src/useProxy.ts": valtio.useProxy,
    "src/molecules.ts": {
      code: valtio.molecules,
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
