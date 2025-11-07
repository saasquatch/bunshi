export { default as jotai } from "./jotai/sources";
export { default as lifecycle } from "./lifecycle/sources";
export { default as nanostores } from "./nanostores/sources";
export { default as quickstart } from "./quickstart/sources";
export { default as valtio } from "./valtio/sources";
export { default as vueRefs } from "./vue-refs/sources";
export { default as xstate } from "./xstate/sources";
export { default as zag } from "./zag/sources";
export { default as zustand } from "./zustand/sources";


import xstateExamples from "~/source-examples/xstate/examples.code";
import zustandExamples from "~/source-examples/zustand/examples.code";
import valtioExamples from "~/source-examples/valtio/examples.code";

// Map of categories to their example configs
export const categories = {
  xstate: xstateExamples,
  zustand: zustandExamples,
  valtio: valtioExamples,
};
