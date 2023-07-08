<script setup lang="ts">
import { useMolecule } from '../';
import { CountMolecule } from './CountMolecule';
const { count, username } = useMolecule(CountMolecule)
</script>

<template>
  <div>
    <p>Times clicked: {{ count }}</p>
    <button @click="count++">
      increment
    </button>
    <button @click="count = 0">
      reset
    </button>
    <span>Username: {{username}}</span>
  </div>
</template>