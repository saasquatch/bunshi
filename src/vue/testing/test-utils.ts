// test-utils.js
import { render, type RenderOptions } from "@testing-library/vue";
import { defineComponent, h, shallowRef, toRef, VueElement } from "vue";

/**
 * Wraps a composable into a component with instrumentation
 * to capture it's values
 *
 * TODO: Contribute tihs back to `@testing-library/vue` -- it's like version of the React hooks testing library
 *
 * @param composable - the composable to test
 * @returns a component that is renderable
 */
export function wrap<T>(
  composable: () => T,
  options?: { Wrapper: VueElement },
) {
  const innerComponent = defineComponent({
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

  const component = options?.Wrapper
    ? /**
       * When there is a wrapper, then use JSX support from vue to create
       * it, and pass the composable in the default slot
       *
       * https://vuejs.org/guide/extras/render-function.html#passing-slots
       */
      () => h(options?.Wrapper, null, { default: () => h(innerComponent) })
    : /**
       * No wrapper, so use the component as it is
       */
      innerComponent;

  return {
    component,
    render(options?: RenderOptions) {
      let result = shallowRef<T | undefined>(undefined);

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
