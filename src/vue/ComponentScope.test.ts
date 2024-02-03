import { ref } from "vue";
import { ComponentScope, createInjector, molecule, use, useMolecule } from ".";
import { createLifecycleUtils } from "../shared/testing/lifecycle";
import { InjectorSymbol } from "./internal/symbols";
import { wrap } from "./testing/test-utils";

const ComponentScopedCountMolecule = molecule(() => {
  use(ComponentScope);
  compScopedLifecycle.connect();
  return ref(0);
});

const GlobalScopedMoleculeCountMolecule = molecule((_, scope) => {
  return ref(0);
});

const compScopedLifecycle = createLifecycleUtils();

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
    // Given the lifecycle hooks have never been called
    compScopedLifecycle.expectUncalled();

    // When one component-scoped molecule is used
    testOneCounter(ComponentScopedCountMolecule, 1);

    // Then the component lifecycle events were not called
    expect(compScopedLifecycle.executions).toHaveBeenCalledOnce();
    expect(compScopedLifecycle.mounts).toHaveBeenCalledOnce();
    expect(compScopedLifecycle.unmounts).toHaveBeenCalledOnce();
  });
  test("two counters should be not be connected when component scoped", () => {
    // Given the lifecycle hooks have never been called
    compScopedLifecycle.expectUncalled();

    // When one component-scoped molecule is used
    testTwoCounters(ComponentScopedCountMolecule, 1);

    // Then the molecule was executed once for each component
    expect(compScopedLifecycle.executions).toHaveBeenCalledTimes(2);
    // And the mount was called once for each component
    expect(compScopedLifecycle.mounts).toHaveBeenCalledTimes(2);
    // And the unmount was called once for each component
    expect(compScopedLifecycle.unmounts).toHaveBeenCalledTimes(2);
  });
});

function testOneCounter(
  mol: typeof ComponentScopedCountMolecule,
  expectedResult: number,
) {
  const injector1 = createInjector();

  const comp = wrap(() => useCounter(mol));
  const [result, rendered] = comp.render({
    global: {
      provide: {
        // mock provide for testing injections
        [InjectorSymbol]: injector1,
      },
    },
  });
  result.value?.increment();
  expect(result.value?.count.value).toBe(expectedResult);
  rendered.unmount();
}

function testTwoCounters(
  mol: typeof ComponentScopedCountMolecule,
  expectedResult: number,
) {
  const comp = wrap(() => useCounter(mol));

  const [result1, render1] = comp.render();
  const [result2, render2] = comp.render();

  result1.value?.increment();
  result2.value?.increment();

  expect(result1.value?.count.value).toBe(expectedResult);
  expect(result2.value?.count.value).toBe(expectedResult);

  render1.unmount();
  render2.unmount();
}
