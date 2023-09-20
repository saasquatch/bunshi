<script lang="ts" setup>
import { provideScope } from '../';
import { userScope } from './CountMolecule';
import DualComponent from './DualComponent.vue';

const { username } = defineProps<{ username: string }>();

provideScope([userScope, username]);
</script>

<template>
    <div>
        <span>Provided Name: {{username}}</span>
        <DualComponent data-testid="dual-1" />
        <DualComponent data-testid="dual-2" />
    </div>
</template>