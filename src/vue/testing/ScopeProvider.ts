import { defineComponent, h, type Component } from "vue";
import type { AnyScopeTuple } from "../../vanilla/internal/internal-types";
import { provideScope } from "../provideScopes";

export const ScopeProvider = defineComponent({
  props: {
    tuple: null,
  },
  setup(props) {
    provideScope(props.tuple);
  },
  template: `<div><slot/></div>`,
});

export const createProvider = (tuple: AnyScopeTuple): Component => {
  return {
    props: {},
    render() {
      // <ScopeProvider><slot /></ScopeProvider>
      return h(ScopeProvider, { tuple }, () => this.$slots.default());
    },
  };
};

export default ScopeProvider;
