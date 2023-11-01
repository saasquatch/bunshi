import ReactApp from "./App.tsx?raw";
import VueApp from "./App.vue?raw";
import VueCounter from "./Counter.vue?raw";
import molecules from "./molecules.ts?raw";

// Component scoped
import molecules2 from "./molecules2.ts?raw";
import molecules2react from "./molecules2react.ts?raw";

// Form scoped
import molecules3 from "./molecules3.ts?raw";
import ReactFormApp from "./FormApp.tsx?raw";
import VueFormApp from "./FormApp.vue?raw";
import VueForm from "./Form.vue?raw";

const quickstart = {
  molecules,
  molecules2,
  VueApp,
  VueCounter,
  ReactApp,

  // Component scoped
  molecules2react,

  // Form scoped 
  molecules3,
  ReactFormApp,
  VueFormApp,
  VueForm
};

export default quickstart;
