import { fireEvent, render, screen, within } from "@testing-library/vue";
import {
  createInjector,
  getDefaultInjector,
  provideInjector,
  useInjector,
} from ".";
import { InjectorSymbol } from "./internal/symbols";
import Component from "./testing/Component.vue";
import DualComponent from "./testing/DualComponent.vue";
import UserComponent from "./testing/UserComponent.vue";
import { wrap } from "./testing/test-utils";
import { defineComponent, h } from "vue";

test("increments value on click", async () => {
  render(Component);

  // screen has all queries that you can use in your tests.
  // getByText returns the first matching node for the provided text, and
  // throws an error if no elements match or if more than one match is found.
  screen.getByText("Times clicked: 0");

  const button = screen.getByText("increment");

  // Dispatch a native click event to our button element.
  await fireEvent.click(button);
  await fireEvent.click(button);

  screen.getByText("Times clicked: 2");

  const resetButton = screen.getByText("reset");
  // Dispatch a native click event to our button element.
  await fireEvent.click(resetButton);
  screen.getByText("Times clicked: 0");
});

describe("Two counters", async () => {
  it("increments value on click", async () => {
    render(DualComponent);

    await testWithinProvider();
  });
});

describe("User component", async () => {
  it("increments value on click", async () => {
    const result = render(UserComponent, {
      props: {
        username: "bob",
      },
    });

    await testWithinProvider(screen.getByTestId("dual-1"), "bob");
    await testWithinProvider(screen.getByTestId("dual-2"), "bob");

    result.unmount();

    render(UserComponent, {
      props: {
        username: "bob2",
      },
    });

    await testWithinProvider(screen.getByTestId("dual-1"), "bob2");
    await testWithinProvider(screen.getByTestId("dual-2"), "bob2");
  });
});

export async function testWithinProvider(
  provider: HTMLElement = document.documentElement,
  username = "none",
) {
  const counterOne = within(provider).getByTestId("counter-1");
  const counterTwo = within(provider).getByTestId("counter-2");

  // Ensure starting state
  within(counterOne).getByText("Times clicked: 0");
  within(counterTwo).getByText("Times clicked: 0");

  const button = within(counterOne).getByText("increment");
  const button2 = within(counterTwo).getByText("increment");

  // Dispatch a native click event to our button element.
  await fireEvent.click(button);
  await fireEvent.click(button);

  within(counterOne).getByText("Times clicked: 2");
  within(counterTwo).getByText("Times clicked: 2");

  // Dispatch a native click event to our button element.
  await fireEvent.click(button2);
  await fireEvent.click(button2);

  within(counterOne).getByText("Times clicked: 4");
  within(counterTwo).getByText("Times clicked: 4");

  const resetButton = within(counterOne).getByText("reset");
  // Dispatch a native click event to our button element.
  await fireEvent.click(resetButton);

  within(counterOne).getByText("Times clicked: 0");

  within(counterOne).getByText(`Username: ${username}`);
}

describe("Providing values ", () => {
  test("Returns default injector by default", () => {
    const [result, rendered] = wrap(() => useInjector()).render();

    expect(result.value).toBe(getDefaultInjector());

    rendered.unmount();
  });

  test("useInjector can use global value", () => {
    const injector1 = createInjector();
    const [result, rendered] = wrap(() => useInjector()).render({
      global: {
        provide: {
          [InjectorSymbol]: injector1,
        },
      },
    });

    expect(result.value).toBe(injector1);
    rendered.unmount();
  });

  test("provideInjector provides injector to child components", () => {
    const customInjector = createInjector();

    // Create a parent component that provides the injector
    const ParentComponent = defineComponent({
      setup() {
        provideInjector(customInjector);
        return () => h(ChildComponent);
      },
    });

    // Create a child component that uses the injector
    const ChildComponent = defineComponent({
      setup() {
        const injector = useInjector();
        return () =>
          h(
            "div",
            { "data-testid": "child" },
            injector === customInjector ? "custom" : "default",
          );
      },
    });

    const { getByTestId, unmount } = render(ParentComponent);

    // Verify the child received the custom injector
    expect(getByTestId("child").textContent).toBe("custom");

    unmount();
  });
});
