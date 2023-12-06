---
title: "React"
---

Bunshi ships with support for React out of the box.

```ts
import { useMolecule, ScopeProvider } from "bunshi/react";
```

## Basic API

### useMolecule

Use a molecule for the current scope. Will produce a different value depending on the React context it is run in.

```tsx
import { useMolecule } from "bunshi/react";
import { useSetAtom, useAtomValue } from "jotai";

export const PageComponent = () => {
  const pageAtoms = useMolecule(PageMolecule);

  const setParams = useSetAtom(pageAtoms.setParams);
  const page = useAtomValue(pageAtoms.currentPage);

  return (
    <div>
      Page: {page}
      <br />
      <button onClick={() => setParams({ date: Date.now() })}>
        Set current time
      </button>
    </div>
  );
};
```

By default `useMolecule` will provide a molecule based off the _implicit_ scope from context. You can override this behaviour by passing options to `useMolecule`.

- `withScope` - will overide a scope value
- `withUniqueScope` - will override a scope value with a new unique value
- `exclusiveScope` - will override ALL scopes

Instead of a scope provider, you can use an explicit scope when using a molecule. This can simplify integrating with other libraries.

**Implicit scope:**

```tsx
const App = () => (
  <ScopeProvider scope={UserScope} value={"sam@example.com"}>
    <UserComponent />
  </ScopeProvider>
);
```

**Explicit scope:**

```tsx
useMolecule(UserMolecule, { withScope: [UserScope, "sam@example.com"] });
```

### ScopeProvider

Provides a new value for Scope, similar to React Context. This will create new molecules in the react tree that depend on it.

```tsx
import { ScopeProvider } from "bunshi/react";

const App = () => (
  <ScopeProvider scope={UserScope} value={"sam@example.com"}>
    <UserComponent />
  </ScopeProvider>
);
```

- `scope` the `MoleculeScope` reference to provide
- `value` a new value for that scope
