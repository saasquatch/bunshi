<script setup>
import { useMolecule } from "bunshi/vue";

import * as pagination from "@zag-js/pagination";
import { normalizeProps, useActor } from "@zag-js/vue";
import { computed } from "vue";

import { PaginationMolecule } from "./molecules";
import "./style.css";

const actor = useMolecule(PaginationMolecule);
const [state, send] = useActor(actor);

const api = computed(() => pagination.connect(state.value, send, normalizeProps))
</script>

<template>
  <nav v-if="api.totalPages > 1" v-bind="api.rootProps">
    <ul>
      <li>
        <a href="#previous" v-bind="api.prevTriggerProps">
          &lt; <span class="visually-hidden">Previous Page</span>
        </a>
      </li>
      <li
        v-for="(page, i) in api.pages"
        :key="page.type === 'page' ? page.value : `ellipsis-${i}`"
      >
        <span v-if="page.type === 'page'">
          <a :href="`#${page.value}`" v-bind="api.getItemProps(page)">
            {{page.value}}
          </a></span
        >
        <span v-else>
          <span v-bind="api.getEllipsisProps({ index: i })">&#8230;</span>
        </span>
      </li>
      <li>
        <a href="#next" v-bind="api.nextTriggerProps">
          &gt; <span class="visually-hidden">Next Page</span>
        </a>
      </li>
    </ul>
  </nav>
</template>