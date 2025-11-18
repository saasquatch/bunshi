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
├── library-name.mdx        # Documentation page using the examples
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

### `library-name.mdx`

Documentation page that imports and uses the examples:

```mdx
---
title: Library Name Recipe
---

import CodeEditor from "~/components/CodeEditor.astro";
import examples from "./examples.code.ts";

## Component-Scoped State

<CodeEditor {...examples.reactComponentState} />

## Global State

<CodeEditor {...examples.reactGlobalState} />
```

### `library-name.spec.ts`

Playwright tests with helper functions for behavioral testing:

```typescript
import { test, expect } from '@playwright/test';
import { createSandpackHelper } from '../../../tests/helpers/sandpack';
import type { Page } from '@playwright/test';

async function testIndependentCounters(page: Page, url: string) {
  // Test that component-scoped state creates independent instances
}

async function testSynchronizedCounters(page: Page, url: string) {
  // Test that global state synchronizes across instances
}

test.describe('Library Name Recipe', () => {
  test.describe('Component State Examples', () => {
    test('React component state - counters should have independent state', async ({ page }) => {
      await testIndependentCounters(page, '/test/libraryname/reactComponentState/');
    });
    
    test('Vue component state - counters should have independent state', async ({ page }) => {
      await testIndependentCounters(page, '/test/libraryname/vueComponentState/');
    });
  });

  test.describe('Global State Examples', () => {
    test('React global state - counters should share synchronized state', async ({ page }) => {
      await testSynchronizedCounters(page, '/test/libraryname/reactGlobalState/');
    });
    
    test('Vue global state - counters should share synchronized state', async ({ page }) => {
      await testSynchronizedCounters(page, '/test/libraryname/vueGlobalState/');
    });
  });
});
```

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

5. **Create `newlibrary.mdx`** in your docs structure

6. **Create `newlibrary.spec.ts`** with Playwright tests

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
- ✅ Examples work in Chrome, Firefox, and Safari

## Best Practices

1. **Consistent naming**: Use the 4 standard export names (`reactComponentState`, `vueComponentState`, `reactGlobalState`, `vueGlobalState`)

2. **Co-located tests**: Keep test files alongside the examples they test

3. **Shared dependencies**: Extract common dependencies to `sharedDependencies` object

4. **Active file**: Set `active: true` on the file that should be shown by default (typically `molecules.ts` or `molecules2.ts`)

5. **Vue templates**: Always specify `template: "vite-vue"` for Vue examples

6. **Helper functions**: Use helper functions in tests to reduce duplication (e.g., `testIndependentCounters`, `testSynchronizedCounters`)

7. **Test URLs**: Use the dynamic test page URLs (`/test/[category]/[example]/`) for testing

8. **Browser compatibility**: Test in Chrome, Firefox, and Safari (webkit)

## Troubleshooting

### Vue examples not loading in tests

Vue examples in Sandpack iframes can have timing issues. The tests include additional wait times:

```typescript
await page.waitForTimeout(3000);
```

### Tests failing with "locator resolved to 0 elements"

The Sandpack iframe may not have loaded yet. Ensure you're using `createSandpackHelper` and `waitForSandpackIframe()`:

```typescript
const sandpack = createSandpackHelper(page);
const iframe = await sandpack.waitForSandpackIframe();
await page.waitForTimeout(3000); // Additional wait for content
```

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
- [Sandpack Helper](../../tests/helpers/sandpack.ts) - Test utilities for Sandpack iframes
- [Dynamic Test Page Template](../pages/test/[category]/[example].astro) - Test page generator
