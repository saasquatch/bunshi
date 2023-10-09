---
title: "Molecules"
sidebar:
  order: 1
---

Molecules are the core building block of bunshi. They are functions that return a value.

```ts
import { molecule } from "bunshi";

export const RandomMolecule = molecule(() => Math.random());
```

> When this `RandomMolecule` is used, it will always return the same random number. The value is memoized and cached.

Molecules can depend on other molecules. When molecules depend on other molecules, anything that they depend on will be automatically created.

```ts
import { molecule } from "bunshi";

export const RandomMolecule = molecule(() => Math.random());
export const UsernameMolecule = molecule(
  (mol) => `You are user ${mol(RandomMolecule)}`
);
export const IDMolecule = molecule((mol) => `ID: ${mol(RandomMolecule)}`);
```

Molecules can also depend on [scopes](/scopes). When a molecule depends on a scope, then an instance will be created for each scope. In other words, your molecule function will be run once per unique scope, instead of once globally for your application.

```ts
import { molecule } from "bunshi";
import { userIdScope } from "./scopes";

export const UsernameMolecule = molecule(
  (mol, scope) => `You are user ${scope(userIdScope)}`
);
export const IDMolecule = molecule((mol) => `ID: ${scope(userIdScope)}`);
```

## Best Practices

Molecules don't just have to return one thing. For example, if you're using `jotai`, you would normally return a whole set of atoms (i.e. a molecule).

```ts
import { molecule } from "bunshi";
import { atom } from "jotai";

export const FormAtom = molecule(() => {
  const dataAtom = atom({});
  const errorsAtom = atom([]);
  const hasErrors = atom((get) => get(errorsAtom).length > 0);

  // Molecules can return a set of atoms
  return {
    dataAtom,
    errorsAtom,
    hasErrors,
  };
});
```

Molecules don't just have to return only one type of thing. They can create stores using one
or many libraries and wire them all together.

```ts
import { molecule, ComponentScope } from "bunshi";

// Import Zustand
import create from "zustand/vanilla";

// Import Valtio
import { proxy } from "valtio/vanilla";

// Import Jotai
import { atom } from "jotai";

// Adapters for wiring them together
import { atomWithStore } from "jotai-zustand";
import { atomWithProxy } from "jotai-valtio";

export const CountersAtom = molecule(() => {
  // Zustand store
  const counterStore = create(() => ({ count: 0 }));

  // Valtio proxy
  const counterProxy = proxy({ count: 0 });

  // Jotai atom
  const counterAtom = atom(0);

  // Derived atom that uses all 3 values
  const storeAtom = atomWithStore(counterStore);
  const proxyAtom = atomWithProxy(proxyState);
  const derivedAtom = atom(
    (get) => get(storeAtom) * get(proxyAtom) * get(counterAtom)
  );

  // Molecules returns all the stores
  return {
    counterStore,
    counterProxy,
    counterAtom,
    derivedAtom,
  };
});
```

## Rules

- A molecule without any dependencies or scopes will only be called once.
- A molecule that depends on scope (i.e. a scoped molecule) will be called once per unique scope.
- A molecule that depends on a _Scoped Molecule_ will be called once per unique scope of it's dependency.
- If a molecule calls `scope` then it will be a _scoped molecule_
- If a molecule calls `mol` then it will _depend_ on that molecule
