import { act, renderHook } from "@testing-library/react-hooks";
import { atom, useAtom } from "jotai";
import { createLifecycleUtils } from "../shared/testing/lifecycle";
import { ComponentScope, molecule } from "./";
import { createTestInjectorProvider } from "./testing/TestInjectorProvider";
import { strictModeSuite } from "./testing/strictModeSuite";
import { useMolecule } from "./useMolecule";

const compLifecycle = createLifecycleUtils();

const ComponentScopedCountMolecule = molecule((_, scope) => {
  scope(ComponentScope);
  compLifecycle.connect();
  return atom(0);
});

const GlobalScopedMoleculeCountMolecule = molecule((_, scope) => {
  return atom(0);
});

const useCounter = (mol: typeof ComponentScopedCountMolecule) => {
  const [count, setCount] = useAtom(useMolecule(mol));
  return {
    count,
    increment: () => setCount((c) => c + 1),
  };
};

strictModeSuite(({ wrapper: Outer }) => {
  describe("Global scoped molecules", () => {
    test("should increment counter", () => {
      testOneCounter(GlobalScopedMoleculeCountMolecule, 1);
    });
    test("two counters should be connected for global scope", () => {
      // Note: This is an important test case, because
      // it makes sure that our `testTwoCounters` function
      // can tell the difference between a globally
      // scoped molecule and not component-scope molecule
      testTwoCounters(GlobalScopedMoleculeCountMolecule, {
        actual1: true,
        actual2: true,
        expected1: 2,
        expected2: 2,
      });
    });
  });

  describe("Component scoped molecules", () => {
    test("should increment counter", () => {
      compLifecycle.expectUncalled();
      testOneCounter(ComponentScopedCountMolecule, 1);

      expect(compLifecycle.executions).toHaveBeenCalledOnce();
      expect(compLifecycle.mounts).toHaveBeenCalledOnce();
      expect(compLifecycle.unmounts).toHaveBeenCalledOnce();
    });
    test("two counters should be not be connected when component scoped", () => {
      compLifecycle.expectUncalled();
      testTwoCounters(ComponentScopedCountMolecule, {
        actual1: true,
        actual2: true,
        expected1: 1,
        expected2: 1,
      });
      expect(compLifecycle.executions).toHaveBeenCalledTimes(2);
      expect(compLifecycle.mounts).toHaveBeenCalledTimes(2);
      expect(compLifecycle.unmounts).toHaveBeenCalledTimes(2);
    });
    test("two counters should be not be connected when component scoped, only one", () => {
      testTwoCounters(ComponentScopedCountMolecule, {
        actual1: true,
        actual2: false,
        expected1: 1,
        expected2: 0,
      });
    });
    test("two counters should be not be connected when component scoped, only one", () => {
      testTwoCounters(ComponentScopedCountMolecule, {
        actual1: false,
        actual2: true,
        expected1: 0,
        expected2: 1,
      });
    });
  });

  function testOneCounter(
    mol: typeof ComponentScopedCountMolecule,
    expectedResult: number,
  ) {
    const TestInjectorProvider = createTestInjectorProvider(Outer);

    const { result, ...rest } = renderHook(() => useCounter(mol), {
      wrapper: TestInjectorProvider,
    });

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(expectedResult);

    rest.unmount();
  }

  function testTwoCounters(
    mol: typeof ComponentScopedCountMolecule,
    opts: {
      actual1: boolean;
      actual2: boolean;
      expected2: number;
      expected1: number;
    },
  ) {
    const TestInjectorProvider = createTestInjectorProvider(Outer);

    const { result: result1, ...rest1 } = renderHook(() => useCounter(mol), {
      wrapper: TestInjectorProvider,
    });
    const { result: result2, ...rest2 } = renderHook(() => useCounter(mol), {
      wrapper: TestInjectorProvider,
    });

    act(() => {
      opts.actual1 && result1.current.increment();
    });
    act(() => {
      opts.actual2 && result2.current.increment();
    });

    expect(result1.current.count).toBe(opts.expected1);
    expect(result2.current.count).toBe(opts.expected2);

    rest1.unmount();
    rest2.unmount();
  }
});
