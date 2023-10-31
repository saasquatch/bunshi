<script setup>
import { useMolecule } from "bunshi/vue";
import { ref, onMounted, onUnmounted } from "vue";
import { ResizeMolecule } from "./molecules";

const observer = useMolecule(ResizeMolecule);
const root = ref(null);
onMounted(() => observer.observe(root.value));
onUnmounted(() => observer.unobserve(root.value));
</script>
<style>
.resize {
  border: 2px solid;
  padding: 20px;
  width: 300px;
  resize: both;
  overflow: auto;
}
</style>
<template>
  <div ref="root" class="resize">My size is being watched.</div>
</template>
