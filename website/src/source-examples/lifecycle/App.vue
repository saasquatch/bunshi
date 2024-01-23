<script setup>
import { ref } from "vue";
import Counter from "./Counter.vue";

const isMounted = ref(false);
</script>

<template>
  <div>
    Open your browser console to see the logs for lifecycle events.
    <button @click="isMounted = !isMounted">Toggle counter</button>
    <div v-if="isMounted">
      <Counter />
      <Counter />
    </div>
  </div>
</template>
