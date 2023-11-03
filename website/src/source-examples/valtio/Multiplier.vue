<script setup>
import { useMolecule } from "bunshi/vue";
import { MultiplierMolecule } from "./molecules";
import { useProxy } from "./useProxy";

const multiplierProxy = useMolecule(MultiplierMolecule);
const multiple = useProxy(multiplierProxy);
const increment = () => multiplierProxy.count++;
</script>

<template>
  <div>
    <p>Multiplier: {{ multiple.count }}</p>
    <button @click="increment()">increment</button>
  </div>
</template>
