<script setup>
import { useMolecule } from "bunshi/vue";
import { CountMolecule } from "./molecules";
import { useAtom } from "jotai-vue";

const countAtom = useMolecule(CountMolecule);
const [count, setCount] = useAtom(countAtom);
</script>

<template>
  <div>
    <p>Clicks: {{ count }}</p>
    <button @click="setCount((prev) => prev + 1)">increment</button>
  </div>
</template>
