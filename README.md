# Jotai Molecules

A tiny, fast, dependency-free 1.18kb library for creating [jotai](https://jotai.org/) atoms in a way that lets you lift state up, or push state down. See [Motivation](#motivation) for more details on why we created this library.

## Installation

This module is published on NPM as `jotai-molecules`

```sh
npm i jotai-molecules
```

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

## Differences from Jotai

Molecules are similar to and inspired by [jotai](https://jotai.org/) atoms, but with a few important differences:

- **Molecules can't be async**, but atoms can be.
- **Molecule scopes can be interconnected**, but atom scopes are "separate universes".
- **Molecules can depend on molecules AND scope**, but atoms only depend on other atoms.
- **Molecules are read-only**, but atoms can be writable.

## Motivation

In jotai, it is easy to do global state... but jotai is [much more powerful](https://jotai.org/docs/guides/atoms-in-atom) when used for more than just global state!

The problem is the atom lifecycle, because we need to follow the mantras of jotai:

- Creating an atom creates state
- You must [memoize your atom creation](https://jotai.org/docs/basics/primitives#atom) (or use a global consts: `export const myAtom = atom("");`)

The challenge with jotai is getting a reference to an atom outside of a component/hook. It is hard to do [recursive atoms](https://github.com/pmndrs/jotai/issues/783) or [scoped atoms](https://github.com/pmndrs/jotai/discussions/682). Jotai molecules fixes this:

- You can [lift state up](https://reactjs.org/docs/lifting-state-up.html), by changing your molecule definitions
- When you lift state up, or push state down, you don't need to refactor your component

Let's examine this idea by looking at an example `Counter` component.

The most important function in these examples is the `createAtom` function, it creates all the state:

```ts
const createAtom = () => atom(0);
```

Here is an example of the two synchronized `Counter` components using **global state**.

```tsx
import { atom, useAtom } from "jotai";

const createAtom = () => atom(0);
const countAtom = createAtom();

const Counter = () => {
  const [count, setCount] = useAtom(countAtom);
  return (
    <div>
      count: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

export const App = () => (
  <>
    <Counter /> <Counter />
  </>
);
```

Here is the same component with **Component State**. Notice the use of `useMemo`:

```tsx
import { atom, useAtom } from "jotai";

const createAtom = () => atom(0);

const Counter = () => {
  const countAtom = useMemo(createAtom, []);
  const [count, setCount] = useAtom(countAtom);
  return (
    <div>
      count: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

export const App = () => (
  <>
    <Counter /> <Counter />
  </>
);
```

Here is a component with **context-based state**:

```tsx
import { atom, useAtom } from "jotai";

const createAtom = () => atom(0);

const CountAtomContext = React.createContext(createAtom());
const useCountAtom = () => useContext(CountAtomContext);
const CountAtomScopeProvider = ({ children }) => {
  const countAtom = useMemo(createAtom, []);
  return (
    <CountAtomContext.Provider value={countAtom}>
      {children}
    </CountAtomContext.Provider>
  );
};

const Counter = () => {
  const countAtom = useCountAtom();
  const [count, setCount] = useAtom(countAtom);
  return (
    <div>
      count: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

export const App = () => (
  <CountAtomScopeProvider>
    <Counter />
    <CountAtomScopeProvider>
      <Counter />
      <Counter />
    </CountAtomScopeProvider>
  </CountAtomScopeProvider>
);
```

Or, to make that context scoped based off a **scoped context**

```tsx
import { atom, useAtom } from "jotai";

const createAtom = (userId: string) =>
  atom(userId === "bob@example.com" ? 0 : 1);

const CountAtomContext = React.createContext(createAtom());
const useCountAtom = () => useContext(CountAtomContext);
const CountAtomScopeProvider = ({ children, userId }) => {
  // Create a new atom for every user Id
  const countAtom = useMemo(() => createAtom(userId), [userId]);
  return (
    <CountAtomContext.Provider value={countAtom}>
      {children}
    </CountAtomContext.Provider>
  );
};

const Counter = () => {
  const countAtom = useCountAtom();
  const [count, setCount] = useAtom(countAtom);
  return (
    <div>
      count: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

export const App = () => (
  <CountAtomScopeProvider userId="bob@example.com">
    <Counter />
    <Counter />
    <CountAtomScopeProvider userId="tom@example.com">
      <Counter />
      <Counter />
    </CountAtomScopeProvider>
  </CountAtomScopeProvider>
);
```

For all of these examples;

- to lift state up, or push state down, we had to refactor `<Counter>`
- the more specific we want the scope of our state, the more boilerplate is required

With molecules, you can change how atoms are created **without having to refactor your components**.

Here is an example of the `<Counter>` component with **global state**:

```tsx
import { atom, useAtom } from "jotai";
import { molecule, useMolecule } from "jotai-molecules";

const countMolecule = molecule(() => atom(0));

const Counter = () => {
  const countAtom = useMolecule(countMolecule);
  const [count, setCount] = useAtom(countAtom);
  return (
    <div>
      count: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

export const App = () => <Counter />;
```

For a scoped molecule, change the molecule definition and don't refactor the component.
Now, you can follow the React best practice of [Lifting State Up](https://reactjs.org/docs/lifting-state-up.html) by adding a molecule, and then lifting the state up, or pushing the state down.

Here is an example of the `<Counter>` component with **scoped context state**:

```tsx
import { atom, useAtom } from "jotai";
import {
  molecule,
  useMolecule,
  createScope,
  ScopeProvider,
} from "jotai-molecules";

const UserScope = createScope(undefined);
const countMolecule = molecule((getMol, getScope) => {
  const userId = getScope(UserScope);
  console.log("Creating a new atom for", userId);
  return atom(0);
});

// ... Counter unchanged

export const App = () => (
  <ScopeProvider scope={UserScope} value={"bob@example.com"}>
    <Counter />
  </ScopeProvider>
);
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
