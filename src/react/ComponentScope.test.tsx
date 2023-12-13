import { act, renderHook } from "@testing-library/react";
import { atom, useAtom } from "jotai";
import { createLifecycleUtils } from "../shared/testing/lifecycle";
import { ComponentScope, molecule, resetDefaultInjector, use } from "./";
import { strictModeSuite } from "./testing/strictModeSuite";
import { useMolecule } from "./useMolecule";

const compLifecycle = createLifecycleUtils();

const ComponentScopedCountMolecule = molecule(() => {
  use(ComponentScope);
  compLifecycle.connect();
  return atom(0);
});

const globalCompLifecycle = createLifecycleUtils();
const GlobalScopedMoleculeCountMolecule = molecule(() => {
  const value = atom(0);
  globalCompLifecycle.connect(value);
  return value;
});

const useCounter = (mol: typeof ComponentScopedCountMolecule) => {
  const [count, setCount] = useAtom(useMolecule(mol));
  return {
    count,
    increment: () => setCount((c) => c + 1),
  };
};

beforeEach(() => {
  resetDefaultInjector({
    //  instrumentation: new LoggingInstrumentation()
  });
  compLifecycle.reset();
});

strictModeSuite(({ wrapper: Outer }) => {
  describe("Global scoped molecules", () => {
    test("one counter", () => {
      globalCompLifecycle.expectUncalled();
      testOneCounter(GlobalScopedMoleculeCountMolecule, 1);
      expect(globalCompLifecycle.executions).toHaveBeenCalledOnce();
      expect.soft(globalCompLifecycle.mounts).toHaveBeenCalledOnce();
      expect(globalCompLifecycle.unmounts).toHaveBeenCalledOnce();
    });
    test("two counters should be connected for global scope", () => {
      // Note: This is an important test case, because
      // it makes sure that our `testTwoCounters` function
      // can tell the difference between a globally
      // scoped molecule and not component-scope molecule
      globalCompLifecycle.expectUncalled();

      testTwoCounters(GlobalScopedMoleculeCountMolecule, {
        actual1: true,
        actual2: true,
        expected1: 2,
        expected2: 2,
      });

      expect.soft(globalCompLifecycle.executions).toHaveBeenCalledOnce();
      expect.soft(globalCompLifecycle.mounts).toHaveBeenCalledOnce();
      expect.soft(globalCompLifecycle.unmounts).toHaveBeenCalledOnce();
    });
  });

  describe("Component scoped molecules", () => {
    test("one counter", () => {
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
    test("two counters should be not be connected when component scoped, use first one", () => {
      compLifecycle.expectUncalled();
      testTwoCounters(ComponentScopedCountMolecule, {
        actual1: true,
        actual2: false,
        expected1: 1,
        expected2: 0,
      });
      expect(compLifecycle.executions).toHaveBeenCalledTimes(2);
      expect(compLifecycle.mounts).toHaveBeenCalledTimes(2);
      expect(compLifecycle.unmounts).toHaveBeenCalledTimes(2);
    });
    test("two counters should be not be connected when component scoped, use second one", () => {
      testTwoCounters(ComponentScopedCountMolecule, {
        actual1: false,
        actual2: true,
        expected1: 0,
        expected2: 1,
      });
      expect(compLifecycle.executions).toHaveBeenCalledTimes(2);
      expect(compLifecycle.mounts).toHaveBeenCalledTimes(2);
      expect(compLifecycle.unmounts).toHaveBeenCalledTimes(2);
    });
  });

  function testOneCounter(
    mol: typeof ComponentScopedCountMolecule,
    expectedResult: number,
  ) {
    const { result, ...rest } = renderHook(() => useCounter(mol));

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
    const { result: result1, ...rest1 } = renderHook(() => useCounter(mol));
    const { result: result2, ...rest2 } = renderHook(() => useCounter(mol));

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
