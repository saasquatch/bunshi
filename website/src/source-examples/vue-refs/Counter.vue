<script setup>
import { useMolecule } from "bunshi/vue";
import { CountMolecule } from "./molecules";

const { countRef, valueRef } = useMolecule(CountMolecule);
const increment = () => countRef.value++;
</script>

<template>
  <div>
    <p>Clicks: {{ countRef }} for total value {{ valueRef }}</p>
    <button @click="increment()">increment</button>
  </div>
</template>
