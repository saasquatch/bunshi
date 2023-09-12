---
title: "Vue"
---

Bunshi ships with support for Vue out of the box. Support is based on the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) introduced in Vue 3.

```js
import { useMolecule, provideScope } from "bunshi/vue"
```

## Basic API

### useMolecule

Use a molecule for the current scopes. Will produce a different value depending on the scope of the component that uses it.

```vue
<script setup>
import { useMolecule } from 'bunshi/vue';
import { useStore } from '@nanostores/vue'
import { FormErrors } from '../molecules'

const { errors } = useMolecule(FormErrors);
const list = useStore(errors)
</script>

<template>
  <header>Errors: {{ list.join(", ") }}</header>
</template>
```

By default `useMolecule` will provide a molecule based off the _implicit_ scope of the component. You can override this behaviour by passing options to `useMolecule`.

- `withScope` - will overide a scope value
- `withUniqueScope` - will override a scope value with a new unique value 
- `exclusiveScope` - will override ALL scopes

Instead of implicit scopes from `provideScope`, you can use an explicit scope when using a molecule. This can simplify integrating with other libraries.

### provideScope

Provides a new value for Scope. This will provide scope to any calles to `useMolecule` in components inside of the components `<slot>`.

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

## Vue 2 and Options API

We have decided intentionally not to provide support for the options API. But since Bunshi provides a [vanilla javascript interface](/vanilla), it should be possible to use Bunshi with older version of Vue.