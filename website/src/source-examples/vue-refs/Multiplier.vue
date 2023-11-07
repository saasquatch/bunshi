<script setup>
import { useMolecule } from "bunshi/vue";
import { MultiplierMolecule } from "./molecules";

const multiplierRef = useMolecule(MultiplierMolecule);
const increment = () => multiplierRef.value++;
</script>

<template>
  <div>
    <p>Multiplier: {{ multiplierRef }}</p>
    <button @click="increment()">increment</button>
  </div>
</template>
