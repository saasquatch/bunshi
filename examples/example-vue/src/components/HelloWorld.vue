<script setup lang="ts">
import { useAtom } from "jotai-vue"
import { useMolecule } from "bunshi/vue"
import { countMolecule } from "../Molecules"

defineProps<{ msg: string }>()

const { countAtom } = useMolecule(countMolecule);
const [count, setCount] = useAtom(countAtom);
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="setCount(count + 1)">count is {{ count }}</button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
