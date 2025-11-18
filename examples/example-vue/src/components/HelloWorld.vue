<script setup lang="ts">
import { useMolecule } from "bunshi/vue"
import { useStore } from "@nanostores/vue"
import { countMolecule } from "../Molecules"

defineProps<{ msg: string }>()

const { countAtom } = useMolecule(countMolecule);
const count = useStore(countAtom);
const setCount = () => countAtom.set(countAtom.get() + 1);
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="setCount">count is {{ count }}</button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
