<script setup>
import { useStore } from "vue-zustand";
import { useMolecule } from "bunshi/vue";
import { CountMolecule } from "./molecules";

const countStore = useMolecule(CountMolecule);
const {count, increment} = useStore(countStore);
</script>

<template>
  <div>
    <p>Times clicked: {{ count }}</p>
    <button @click="increment()">increment</button>
  </div>
</template>
