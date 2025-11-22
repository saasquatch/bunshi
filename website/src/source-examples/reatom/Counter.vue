<script setup>
import { reatomRef, useAction } from "@reatom/npm-vue";
import { useMolecule } from "bunshi/vue";
import { CountMolecule } from "./molecules";

const { countAtom, valueAtom, increment } = useMolecule(CountMolecule);
const count = reatomRef(countAtom);
const value = reatomRef(valueAtom);
const handleIncrementClick = useAction(increment);
</script>

<template>
  <div>
    <p>Clicks: {{ count }} for total value {{ value }}</p>
    <button @click="handleIncrementClick">increment</button>
  </div>
</template>
