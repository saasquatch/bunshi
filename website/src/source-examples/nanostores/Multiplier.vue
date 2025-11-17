<script setup>
import { useStore } from "@nanostores/vue";
import { useMolecule } from "bunshi/vue";
import { MultiplierMolecule } from "./molecules";

const multiplierAtom = useMolecule(MultiplierMolecule);
const multiple = useStore(multiplierAtom);
const increment = () => multiplierAtom.set(multiplierAtom.get() + 1);
</script>

<template>
  <div>
    <p>Multiplier: {{ multiple }}</p>
    <button @click="increment()">Multiply</button>
  </div>
</template>
