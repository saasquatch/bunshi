<script setup>
import { provideScope } from "bunshi/vue";
import { FormScope } from "./molecules";

const {name} = defineProps(['name'])

provideScope([FormScope,name])

</script>

<template>
  <div>
    Form: {{name}}
    <slot></slot>
  </div>
</template>