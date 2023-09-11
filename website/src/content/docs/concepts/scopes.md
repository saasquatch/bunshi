---
title: "Scopes"
description: Scopes let you declaratively build graphs of molecules for different components, forms, sections, users, companies or applications and have them run in a shared environment.
sidebar:
  order: 2
---

Scopes let you declaratively build graphs of molecules for different components, forms, sections, users, companies or applications and have them run in a shared environment.

## API

### createScope

Creates a reference for scopes, similar to React Context

```ts
import { createScope } from "bunshi";

/**
 *  Scope for a user id
 */
export const UserScope = createScope<string>("bob@example.com");
```

- `initialValue` the default value for molecules that depend on this scope


### React

In `bunshi/react` use the `ScopeProvider` to provide the scopes. `useMolecule` will implicitly use the provided scope, but scopes can also be accessed directly with `useScopes`.

Internally scopes use [React context](https://react.dev/reference/react/createContext).


### Vue

In `bunshi/vue` use `provideScope` in your setup function to provide the scopes. `useMolecule` will implicitly use the provided scope, but scopes can also be accessed directly with `useScopes`.

Internally scopes use Vue's [provide/inject](https://vuejs.org/guide/components/provide-inject.html).

## Examples


### Form Scope

A common use case for scoping is forms. You create a scope for every form, and then write your molecules to depend on that scope.

Since a new instance of your molecules are created for each scope, you can use this to create state or stores that survive for the lifecycle of your form.


#### Creating scope & molecules

The first thing you need is a scope object. Use `createScope` to create a scope object for later use.

```ts
import { createScope } from "bunshi";

// Scoped using a random number to identify the form
export const formScope = createScope<unknown>(undefined);
```

Once we have a form scope, we depend on that scope in our molecules.

```ts
import { molecule } from "bunshi";
import { atom } from 'nanostores'

// The FormErrors molecule can be used anywhere in the form
export const FormErrors = molecule((mol,scope)=>{

    // Calling `scope` makes `FormErrors` a *scoped* molecule
    scope(formScope);

    // Will create 1 nanostore per form
    const errors = atom<string[]>([])

    function addError(error: string) {
        errors.set([...errors.get(), errors]);
    }

    return {
        addError,
        errors
    }
});
```
>  This example creates [nanostores](https://github.com/nanostores/nanostores) in molecules, but other state management tools like [Jotai](https://jotai.org/) can be used here.


#### Using the scope and scoped molecules

Scoping works out of the box with framework integrations with `vue` and `react`.

To use a scope deep inside a component tree, it needs to be provided at the top level.

In this case we'll use the `provideScope` function from the `bunshi/vue` integration in our root form component.

```vue
<script setup>
import { provideScope } from 'bunshi/vue';
import { formIdScope } from '../scopes'

const formId = Symbol();
provideScope([formIdScope,formId])

</script>

<template>
  <form>
    Form id: {{formId}}
    <slot></slot>
  <form>
</template>
```

In your form component, you can use the molecule to get access to the form state.

```vue
<script setup>
import { useMolecule } from 'bunshi/vue';
import { useStore } from '@nanostores/vue'
import { FormErrors } from '../molecules'

const props = defineProps(['postId'])

const { errors } = useMolecule(FormErrors);

const list = useStore(errors)
</script>

<template>
  <header>Errors: {{ list.join(", ") }}</header>
</template>
```
