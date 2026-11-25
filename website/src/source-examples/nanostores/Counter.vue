<script setup>
import { useStore } from "@nanostores/vue";
import { useMolecule } from "bunshi/vue";
import { CountMolecule } from "./molecules";

const { countAtom, valueAtom, increment } = useMolecule(CountMolecule);
const count = useStore(countAtom);
const value = useStore(valueAtom);

</script>

<template>
  <div>
    <p>Clicks: {{ count }} for total value {{ value }}</p>
    <button @click="increment()">increment</button>
  </div>
</template>
