<script setup>
import { useActor } from "@xstate/vue";
import { useMolecule } from "bunshi/vue";
import { CountMolecule } from "./molecules";

const countActor = useMolecule(CountMolecule);
const machine = useActor(countActor);
const increment = () => machine.send({type:"INCREMENT"});
</script>

<template>
  <div>
    <p>Clicks: {{machine.state.value.context.count }}</p>

    <button @click="increment()">increment</button>
  </div>
</template>
