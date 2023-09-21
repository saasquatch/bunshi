> `jotai-molecules` has been renamed to [bunshi](https://www.npmjs.com/package/bunshi).
>
> All new users of this module should use [bunshi](https://www.npmjs.com/package/bunshi) instead. Bunshi
> adds support for vue, react and vanilla javascript. Development
> and features additions will continue under the [bunshi](https://www.npmjs.com/package/bunshi) package.
>
> Molecules in `jotai-molecules` version 1.2.0 are compatible with
> molecules from `bunshi`, and they can interoperated and depend on each
> others. Version 1.2.0 of `jotai-molecules` is just a wrapper for
> `bunshi`.
>
> Documentation: [bunshi.org](https://www.bunshi.org)

A tiny, fast, dependency-free 1.18kb library for creating [jotai](https://jotai.org/) atoms in a way that lets you lift state up, or push state down. See [Motivation](#motivation) for more details on why we created this library.

## Installation

This module is published on NPM as `jotai-molecules`

```sh
npm i jotai-molecules
```

> Note: Prefer [bunshi](https://www.npmjs.com/package/bunshi) to `jotai-molecules`

## Usage

Molecules are a set of atoms that can be easily scoped globally or per context.

```tsx
import React from "react";
import { atom, useAtom } from "jotai";
import {
  molecule,
  useMolecule,
  createScope,
  ScopeProvider,
} from "jotai-molecules";

const CompanyScope = createScope<string>("example.com");

const CompanyMolecule = molecule((_, getScope) => {
  const company = getScope(CompanyScope);
  const companyNameAtom = atom(company.toUpperCase());
  return {
    company,
    companyNameAtom,
  };
});

const UserScope = createScope<string>("bob@example.com");

const UserMolecule = molecule((getMol, getScope) => {
  const userId = getScope(UserScope);
  const companyAtoms = getMol(CompanyMolecule);
  const userNameAtom = atom(userId + " name");
  const userCountryAtom = atom(userId + " country");
  const groupAtom = atom((get) => {
    return userId + " in " + get(companyAtoms.companyNameAtom);
  });
  return {
    userId,
    userCountryAtom,
    userNameAtom,
    groupAtom,
    company: companyAtoms.company,
  };
});

const App = () => (
  <ScopeProvider scope={UserScope} value={"sam@example.com"}>
    <UserComponent />
  </ScopeProvider>
);

const UserComponent = () => {
  const userAtoms = useMolecule(UserMolecule);
  const [userName, setUserName] = useAtom(userAtoms.userNameAtom);

  return (
    <div>
      Hi, my name is {userName} <br />
      <input
        type="text"
        value={userName}
        onInput={(e) => setUserName((e.target as HTMLInputElement).value)}
      />
    </div>
  );
};
```

## API

### molecule

Create a molecule that can be dependent on other molecules, or dependent on scope.

```ts
import { molecule } from "jotai-molecules";

export const PageMolecule = molecule(() => {
  return {
    currentPage: atom("/"),
    currentParams: atom({}),
  };
});
```

- Requires a getter function
  - `getMol` - depend on the value of another molecule
  - `getScope` - depend on the value of a scope

### useMolecule

Use a molecule for the current scope. Will produce a different value depending on the React context it is run in.

```tsx
import { useMolecule } from "jotai-molecules";
import { useSetAtom, useAtomValue } from "jotai";

export const PageComponent = () => {
  const pageAtoms = useMolecule(PageMolecule);

  const setParams = useSetAtom(pageAtoms.currentPage);
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

- `withScope` - will overide a scope value (`ScopeTuple<unknown>`)
- `withUniqueScope` - will override a scope value with a new unique value (`MoleculeScope<unknown>`)
- `exclusiveScope` - will override ALL scopes (`ScopeTuple<unknown>`)

Instead of a scope provider, you can use an explicit scope when using a molecule. This can simplify integrating jotai with other hooks-based libraries.

**Before:**

```tsx
const App = () => (
  <ScopeProvider scope={UserScope} value={"sam@example.com"}>
    <UserComponent />
  </ScopeProvider>
);
```

**After:**

```tsx
useMolecule(UserMolecule, { withScope: [UserScope, "sam@example.com"] });
```

### createScope

Creates a reference for scopes, similar to React Context

```ts
import { createScope } from "jotai-molecules";

/**
 *  Scope for a user id
 */
export const UserScope = createScope<string>("bob@example.com");
```

- `initialValue` the default value for molecules that depend on this scope

### ScopeProvider

Provides a new value for Scope, similar to React Context. This will create new molecules in the react tree that depend on it.

```tsx
const App = () => (
  <ScopeProvider scope={UserScope} value={"sam@example.com"}>
    <UserComponent />
  </ScopeProvider>
);
```

- `scope` the `MoleculeScope` reference to provide
- `value` a new value for that scope
