<script setup>
import { createCtx } from "@reatom/core";
import { getCurrentInstance } from "vue";
import { createReatomVue } from "@reatom/npm-vue";
import Counter from "./Counter.vue";
import Multiplier from "./Multiplier.vue";

const ctx = createCtx();
const app = getCurrentInstance().appContext.app;
app.use(createReatomVue(ctx));
</script>
<template>
  <Multiplier />
  <Counter />
  <Counter />
</template>
