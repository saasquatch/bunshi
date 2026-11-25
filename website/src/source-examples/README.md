# Source Examples

This directory contains code examples for the Bunshi documentation website. Examples demonstrate how to use Bunshi with various state management libraries and frameworks.

## Directory Structure

Each example category has its own directory:

```
source-examples/
├── sources.ts              # Central registry of all examples
├── xstate/                 # XState integration examples
├── zustand/                # Zustand integration examples
├── valtio/                 # Valtio integration examples
├── nanostores/             # Nanostores integration examples
├── jotai/                  # Jotai integration examples
├── vue-refs/               # Vue Refs examples
├── zag/                    # Zag integration examples
├── lifecycle/              # Lifecycle examples
└── quickstart/             # Quickstart examples
```

## Standard Example Structure

For state management library integrations (xstate, zustand, valtio, nanostores), each directory follows this structure:

```
library-name/
├── sources.ts              # Raw source imports (*.tsx?raw, *.vue?raw)
├── examples.code.ts        # Unified configuration for all examples
├── library-name.spec.ts    # Playwright tests for the examples
├── App.tsx                 # React application component
├── App.vue                 # Vue application component
├── Counter.vue             # Vue counter component (if applicable)
├── Multiplier.vue          # Vue multiplier component (if applicable)
├── molecules.ts            # Global state configuration
└── molecules2.ts           # Component-scoped state configuration
```

## File Conventions

### `sources.ts`

Imports raw source code files for use in examples:

```typescript
import ReactApp from "./App.tsx?raw";
import VueApp from "./App.vue?raw";
import molecules from "./molecules.ts?raw";
import molecules2 from "./molecules2.ts?raw";

const libraryName = {
  ReactApp,
  VueApp,
  molecules,
  molecules2,
  // ... other files
};

export default libraryName;
```

### `examples.code.ts`

Defines a unified configuration with four standard exports:

1. **`reactComponentState`** - React example with component-scoped state
2. **`vueComponentState`** - Vue example with component-scoped state  
3. **`reactGlobalState`** - React example with global state
4. **`vueGlobalState`** - Vue example with global state

Structure:

```typescript
import type { CodeEditorConfig } from "~/components/CodeEditor.types";
import libraryName from "./sources";

const sharedDependencies = {
  react: {
    "library-name": "^x.y.z",
    // ... React-specific dependencies
  },
  vue: {
    "library-name": "^x.y.z",
    // ... Vue-specific dependencies
  },
};

export const reactComponentState: CodeEditorConfig = {
  files: {
    "App.tsx": libraryName.ReactApp,
    "molecules.ts": {
      code: libraryName.molecules2,
      active: true,  // This file will be shown by default
    },
  },
  dependencies: sharedDependencies.react,
};

export const vueComponentState: CodeEditorConfig = {
  files: {
    "src/App.vue": libraryName.VueApp,
    "src/Counter.vue": libraryName.VueCounter,
    "src/molecules.ts": {
      code: libraryName.molecules2,
      active: true,
    },
  },
  dependencies: sharedDependencies.vue,
  template: "vite-vue",  // Required for Vue examples
};

// ... similar for reactGlobalState and vueGlobalState

export default {
  reactComponentState,
  vueComponentState,
  reactGlobalState,
  vueGlobalState,
};
```

### `src/content/docs/recipes/library-name.mdx`

Documentation page that imports and uses the examples:

```mdx
---
title: Library Name Recipe
---

import CodeEditor from "~/components/CodeEditor.astro";
import examples from "~/source-examples/library-name/examples.code";

## Component-Scoped State

<CodeEditor {...examples.reactComponentState} />

## Global State

<CodeEditor {...examples.reactGlobalState} />
```

### `library-name.spec.ts`

Examples that follow the standard counter structure (two counters, each a `<p>Clicks: N</p>` followed by its increment `<button>`) reuse the shared test suite:

```typescript
import { describeCounterRecipe } from "../../../tests/helpers/counter-recipe";

describeCounterRecipe("libraryname");
```

This generates React and Vue tests that open the four `/test/libraryname/*/` pages and check that component state keeps the counters independent while global state shares them. Examples with a different structure should write their own tests using `sandpackPreview()` from `tests/helpers/sandpack.ts`.

## State Patterns

### Component-Scoped State (`molecules2.ts`)

Component-scoped state creates independent instances for each component:

```typescript
import { ComponentScope, molecule } from "bunshi";
import { atom } from "library-name";

export const MultiplierMolecule = molecule(() => atom(0));

export const CountMolecule = molecule((mol, scope) => {
  scope(ComponentScope);  // Makes state component-scoped
  const countAtom = atom(0);
  return countAtom;
});
```

**Behavior**: Each `Counter` component has its own independent state. Clicking one counter doesn't affect others.

### Global State (`molecules.ts`)

Global state is shared across all component instances:

```typescript
import { molecule } from "bunshi";
import { atom } from "library-name";

export const MultiplierMolecule = molecule(() => atom(0));

export const CountMolecule = molecule(() => {
  // No scope() call = global state
  const countAtom = atom(0);
  return countAtom;
});
```

**Behavior**: All `Counter` components share the same state. Clicking any counter updates all counters.

## Dynamic Test Pages

Test pages are dynamically generated at `/test/[category]/[example]/` using the centralized registry in `sources.ts`:

```typescript
// src/source-examples/sources.ts
export const categories = {
  xstate: xstateExamples,
  zustand: zustandExamples,
  valtio: valtioExamples,
  nanostores: nanostoresExamples,
};
```

This generates pages like:
- `/test/xstate/reactComponentState/`
- `/test/xstate/vueComponentState/`
- `/test/zustand/reactGlobalState/`
- etc.

The dynamic page template is at `/src/pages/test/[category]/[example].astro`.

## Adding a New Example Category

1. **Create the directory structure**:
   ```bash
   mkdir src/source-examples/newlibrary
   ```

2. **Create source files**:
   - `App.tsx` - React application
   - `App.vue` - Vue application (optional)
   - `molecules.ts` - Global state configuration
   - `molecules2.ts` - Component-scoped state configuration

3. **Create `sources.ts`**:
   ```typescript
   import ReactApp from "./App.tsx?raw";
   import molecules from "./molecules.ts?raw";
   import molecules2 from "./molecules2.ts?raw";
   
   const newlibrary = { ReactApp, molecules, molecules2 };
   export default newlibrary;
   ```

4. **Create `examples.code.ts`** following the standard structure (see above)

5. **Create `src/content/docs/recipes/newlibrary.mdx`** using the examples

6. **Create `newlibrary.spec.ts`** calling `describeCounterRecipe("newlibrary")`

7. **Register in central sources**:
   ```typescript
   // src/source-examples/sources.ts
   import newlibraryExamples from "~/source-examples/newlibrary/examples.code";
   
   export const categories = {
     // ... existing categories
     newlibrary: newlibraryExamples,
   };
   ```

## Testing

Run Playwright tests for a specific example:

```bash
npm test -- libraryname.spec.ts
```

Run all tests:

```bash
npm test
```

Tests verify:
- ✅ Examples load correctly in Sandpack iframes
- ✅ Component-scoped state creates independent instances
- ✅ Global state synchronizes across instances
- ✅ Counter increment buttons work correctly

Tests run in Chromium only: browser differences are Sandpack's concern, and codesandbox.io serves headless Firefox a bot challenge.

## Best Practices

1. **Consistent naming**: Use the 4 standard export names (`reactComponentState`, `vueComponentState`, `reactGlobalState`, `vueGlobalState`)

2. **Co-located tests**: Keep test files alongside the examples they test

3. **Shared dependencies**: Extract common dependencies to `sharedDependencies` object

4. **Active file**: Set `active: true` on the file that should be shown by default (typically `molecules.ts` or `molecules2.ts`)

5. **Vue templates**: Always specify `template: "vite-vue"` for Vue examples

6. **Shared tests**: Use `describeCounterRecipe` rather than copying test helpers between recipes

7. **Test URLs**: Use the dynamic test page URLs (`/test/[category]/[example]/`) for testing

8. **No fixed sleeps**: Wait on the element you need (`expect(...).toHaveCount(n, { timeout: SANDBOX_BOOT_TIMEOUT })`), never `waitForTimeout`

## Troubleshooting

### Vue examples not loading in tests

Vue examples use Sandpack's Nodebox runtime, which installs dependencies and boots Vite inside the browser. A cold start takes ~20s locally, so the first assertion uses `SANDBOX_BOOT_TIMEOUT` (90s). The Nodebox preview iframe's `src` is on `*.nodebox.codesandbox.io`, so select the preview with `sandpackPreview()` (by its `Sandpack Preview` title), not by `src`.

### Tests failing with "locator resolved to 0 elements"

Open the failure's `error-context.md` (or `npx playwright show-report`) to see what the page rendered. If the preview iframe contains a Cloudflare challenge script, codesandbox.io is blocking the browser rather than the example failing.

### Wrong file shown by default

Set `active: true` on the file you want shown:

```typescript
files: {
  "App.tsx": source.ReactApp,
  "molecules.ts": {
    code: source.molecules,
    active: true,  // This file will be active
  },
}
```

## References

- [CodeEditor Component](../components/CodeEditor.astro) - Sandpack wrapper component
- [CodeEditor Types](../components/CodeEditor.types.ts) - TypeScript type definitions
- [Sandpack Helper](../../tests/helpers/sandpack.ts) - Locates the Sandpack preview iframe
- [Counter Recipe Tests](../../tests/helpers/counter-recipe.ts) - Shared tests for the standard counter examples
- [Dynamic Test Page Template](../pages/test/[category]/[example].astro) - Test page generator
