import { ref } from "vue";
import { ComponentScope, createInjector, molecule, useMolecule } from ".";
import { InjectorSymbol } from "./internal/symbols";
import { withSetup } from "./testing/test-utils";

const ComponentScopedCountMolecule = molecule((_, scope) => {
  scope(ComponentScope);
  return ref(0);
});

const GlobalScopedMoleculeCountMolecule = molecule((_, scope) => {
  return ref(0);
});

const useCounter = (mol: typeof ComponentScopedCountMolecule) => {
  const count = useMolecule(mol);
  return {
    count,
    increment: () => count.value++,
  };
};

describe("Global scoped molecules", () => {
  test("should increment counter", () => {
    testOneCounter(GlobalScopedMoleculeCountMolecule, 1);
  });
  test("two counters should be connected for global scope", () => {
    // Note: This is an important test case, because
    // it makes sure that our `testTwoCounters` function
    // can tell the difference between a globally
    // scoped molecule and not component-scope molecule
    testTwoCounters(GlobalScopedMoleculeCountMolecule, 2);
  });
});

describe("Component scoped molecules", () => {
  test("should increment counter", () => {
    testOneCounter(ComponentScopedCountMolecule, 1);
  });
  test("two counters should be not be connected when component scoped", () => {
    testTwoCounters(ComponentScopedCountMolecule, 1);
  });
});

function testOneCounter(
  mol: typeof ComponentScopedCountMolecule,
  expectedResult: number,
) {
  const injector1 = createInjector();
  const [result, mount, app] = withSetup(() => useCounter(mol));

  // mock provide for testing injections
  app.provide(InjectorSymbol, injector1);

  mount();
  result.value?.increment();
  expect(result.value?.count.value).toBe(expectedResult);

  app.unmount();
}

function testTwoCounters(
  mol: typeof ComponentScopedCountMolecule,
  expectedResult: number,
) {
  const injector1 = createInjector();
  const [result1, mount1, app1] = withSetup(() => useCounter(mol));
  const [result2, mount2, app2] = withSetup(() => useCounter(mol));

  app1.provide(InjectorSymbol, injector1);
  app2.provide(InjectorSymbol, injector1);

  mount1();
  mount2();
  result1.value?.increment();
  result2.value?.increment();

  expect(result1.value?.count.value).toBe(expectedResult);
  expect(result2.value?.count.value).toBe(expectedResult);

  app1.unmount();
  app2.unmount();
}
