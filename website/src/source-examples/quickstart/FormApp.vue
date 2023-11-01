<script setup>
import Counter from "./Counter.vue";
import Form from "./Form.vue";
</script>
<template>
  <div>
    <Form name="one"
      >
      <Counter />
      <Counter />
    </Form>
    <Form name="two"
      >
      <Counter />
      <Counter />
    </Form>
  </div>
</template>
