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
export const UsernameMolecule = molecule((mol) => `You are user ${mol(RandomMolecule)}`);
export const IDMolecule = molecule((mol) => `ID: ${mol(RandomMolecule)}`);
```

Molecules can also depend on [scopes](/scopes). When a molecule depends on a scope, then an instance will be created for each scope. In other words, your molecule function will be run once per unique scope, instead of once globally for your application.

```ts
import { molecule } from "bunshi";
import { userIdScope } from "./scopes";

export const UsernameMolecule = molecule((mol, scope) => `You are user ${scope(userIdScope)}`);
export const IDMolecule = molecule((mol) => `ID: ${scope(userIdScope)}`);
```

## Rules

* A molecule without any dependencies or scopes will only be called once.
* A molecule that depends on scope (a scoped molecule) will be called once per unique scope.
* A molecule that depends on a *Scoped Molecule* will be called once per unique scope of it's dependency.
* If a molecule calls `scope` then it will be a *scoped molecule*
* If a molecule calls `mol` then it will *depend* on that molecule