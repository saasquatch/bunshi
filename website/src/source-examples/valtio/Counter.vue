<script setup>
import { useMolecule } from "bunshi/vue";
import { CountMolecule } from "./molecules";
import { useProxy } from "./useProxy";

const { countProxy, valueProxy, increment } = useMolecule(CountMolecule);
const count = useProxy(countProxy);
const value = useProxy(valueProxy);
</script>

<template>
  <div>
    <p>Clicks: {{ count.count }} for total value {{ value.value }}</p>
    <button @click="increment()">increment</button>
  </div>
</template>
