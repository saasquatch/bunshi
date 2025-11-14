import type { CodeEditorConfig } from "~/components/CodeEditor.types";
import xstate from "./sources";

/**
 * Shared dependencies for XState examples
 */
const sharedDependencies = {
  react: {
    xstate: "^4.38",
    "@xstate/react": "^3.2",
  },
  vue: {
    xstate: "^4.38",
    "@xstate/vue": "^2.0",
  },
};

/**
 * XState React example with component-scoped state
 */
export const reactComponentState: CodeEditorConfig = {
  files: {
    "App.tsx": xstate.ReactApp,
    "molecules.ts": {
      code: xstate.molecules2,
      active: true,
    },
  },
  dependencies: sharedDependencies.react,
};

/**
 * XState Vue example with component-scoped state
 */
export const vueComponentState: CodeEditorConfig = {
  files: {
    "src/App.vue": xstate.VueApp,
    "src/Counter.vue": xstate.VueCounter,
    "src/molecules.ts": {
      code: xstate.molecules2,
      active: true,
    },
  },
  dependencies: sharedDependencies.vue,
  template: "vue",
};

/**
 * XState React example with global state
 */
export const reactGlobalState: CodeEditorConfig = {
  files: {
    "App.tsx": xstate.ReactApp,
    "molecules.ts": {
      code: xstate.molecules,
      active: true,
    },
  },
  dependencies: sharedDependencies.react,
};

/**
 * XState Vue example with global state
 */
export const vueGlobalState: CodeEditorConfig = {
  files: {
    "src/App.vue": xstate.VueApp,
    "src/Counter.vue": xstate.VueCounter,
    "src/molecules.ts": {
      code: xstate.molecules,
      active: true,
    },
  },
  dependencies: sharedDependencies.vue,
  template: "vue",
};

// Default export for convenience
export default {
  reactComponentState,
  vueComponentState,
  reactGlobalState,
  vueGlobalState,
};
