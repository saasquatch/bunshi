// test-utils.js
import { render, type RenderOptions } from "@testing-library/vue";
import { defineComponent, h, shallowRef, toRef, type Component } from "vue";

/**
 * Wraps a composable into a component with instrumentation
 * to capture it's values
 *
 * TODO: Contribute tihs back to `@testing-library/vue` -- it's like version of the React hooks testing library
 *
 * @param composable - the composable to test
 * @returns a component that is renderable
 */
export function wrap<T>(composable: () => T, options?: { Wrapper: Component }) {
  const innerComponent: Component = defineComponent({
    props: {
      result: {
        required: true,
        type: Object,
      },
    },
    setup(props) {
      toRef(props, "result").value = composable() as any;
      return () => {};
    },
  });

  const component: Component = options?.Wrapper
    ? /**
       * When there is a wrapper, then use JSX support from vue to create
       * it, and pass the composable in the default slot
       *
       * https://vuejs.org/guide/extras/render-function.html#passing-slots
       */
      (props) => {
        return h(options?.Wrapper, () => h(innerComponent, props));
      }
    : /**
       * No wrapper, so use the component as it is
       */
      innerComponent;

  return {
    component,
    render(options?: RenderOptions) {
      const result = shallowRef<T | undefined>(undefined);

      const renderResult = render(component, {
        ...options,
        props: {
          ...options?.props,
          result,
        },
      });
      return [result, renderResult] as const;
    },
  };
}
