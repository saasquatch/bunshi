<script setup>
import { reatomRef, useAction } from "@reatom/npm-vue";
import { useMolecule } from "bunshi/vue";
import { MultiplierMolecule } from "./molecules";

const { multiplierAtom } = useMolecule(MultiplierMolecule);
const multiplier = reatomRef(multiplierAtom);
const incrementMultiplier = useAction((ctx) =>
  multiplierAtom(ctx, (multiplier) => multiplier + 1),
);
</script>

<template>
  <div>
    <p>Multiplier: {{ multiplier }}</p>
    <button @click="incrementMultiplier">increment</button>
  </div>
</template>
