import { vi } from "vitest";
import { createInjector } from "./injector";
import { AnyScopeTuple } from "./internal/internal-types";
import { onMount, use } from "./lifecycle";
import { Molecule, molecule } from "./molecule";
import { createScope } from "./scope";

describe("Single scope dependencies", () => {
  function createHarness() {
    const defaultFn = vi.fn();
    const ExampleScope = createScope<Function>(defaultFn);

    const ExampleCleanupMolecule = molecule(() => {
      const testFn = use(ExampleScope);

      onMount(() => {
        testFn("mounted");
        return () => testFn("unmounted");
      });
      testFn("created");
      return testFn;
    });

    const injector = createInjector();

    return { defaultFn, ExampleScope, ExampleCleanupMolecule, injector };
  }

  test("Default scope values are cleaned up", () => {
    const { injector, ExampleCleanupMolecule } = createHarness();

    // FIXME: Would be very handy to be able to use default scope values
    expect(() => injector.use(ExampleCleanupMolecule)).toThrowError();

    // const [value, unsub] = injector.use(ExampleCleanupMolecule);
    // expect(value).toBe(defaultFn);
    // expect(defaultFn).toHaveBeenNthCalledWith(1, "created");
    // expect(defaultFn).toHaveBeenNthCalledWith(2, "mounted");

    // const [value2, unsub2] = injector.use(ExampleCleanupMolecule);
    // expect(value2).toBe(defaultFn);
    // expect(defaultFn).toHaveBeenNthCalledWith(3, "created");

    // unsub2();
    // expect(defaultFn).toHaveBeenCalledTimes(3);

    // unsub();
    // expect(defaultFn).toHaveBeenCalledTimes(4);
    // expect(defaultFn).toHaveBeenNthCalledWith(4, "unmounted");
  });

  test("Derived molecules are cleaned up", () => {
    const { injector, ExampleScope } = createHarness();

    const BaseMolecule:Molecule<Function> = molecule(() => {
      const testFn = use(ExampleScope);
      onMount(() => {
        testFn("base", "mounted");
        return () => testFn("base", "unmounted");
      });
      testFn("base", "created");
      return testFn;
    });

    const DerivedMolecule = molecule(() => {
      // FIXME: Type error here
      // Molecule return type is not inferred
      const testFn = use(BaseMolecule as Molecule<string>);

      onMount(() => {
        testFn("derived", "mounted");
        return () => testFn("derived", "unmounted");
      });
      testFn("derived", "created");
      return testFn;
    });

    const mockFn = vi.fn();
    const scopeTuple: AnyScopeTuple = [ExampleScope, mockFn];

    const [value, unsub] = injector.use(DerivedMolecule, scopeTuple);
    expect(value).toBe(mockFn);

    const expectedCalls1 = [
      ["base", "created"],
      ["base", "mounted"],
      ["derived", "created"],
      ["derived", "mounted"],
    ];
    expect(mockFn.mock.calls).toStrictEqual(expectedCalls1);

    unsub();
    expect(mockFn.mock.calls).toStrictEqual([
      ...expectedCalls1,
      ["base", "unmounted"],
      ["derived", "unmounted"],
    ]);
  });

  test("Scoped molecules are mounted and cleaned up", () => {
    const { injector, ExampleScope, ExampleCleanupMolecule } = createHarness();

    const mockFn = vi.fn();
    const scopeTuple: AnyScopeTuple = [ExampleScope, mockFn];

    const [value, unsub] = injector.use(ExampleCleanupMolecule, scopeTuple);
    expect(value).toBe(mockFn);
    expect(mockFn).toHaveBeenNthCalledWith(1, "created");
    expect(mockFn).toHaveBeenNthCalledWith(2, "mounted");

    const [value2, unsub2] = injector.use(ExampleCleanupMolecule, scopeTuple);
    expect(value2).toBe(mockFn);
    expect(mockFn).toHaveBeenNthCalledWith(3, "created");

    unsub2();
    expect(mockFn).toHaveBeenCalledTimes(3);

    unsub();
    expect(mockFn).toHaveBeenCalledTimes(4);
    expect(mockFn).toHaveBeenNthCalledWith(4, "unmounted");
  });
});

describe("Two scope dependencies", () => {
  test("Scoped molecules are mounted and cleaned up", () => {
    const defaultFnA = () => {};
    const defaultFnB = () => {};
    const ExampleScopeA = createScope<Function>(defaultFnA);
    const ExampleScopeB = createScope<Function>(defaultFnB);
    let instanceCount = 1;
    const ExampleCleanupMolecule = molecule(() => {
      const testFnA = use(ExampleScopeA);
      const testFnB = use(ExampleScopeB);
      const instanceId = instanceCount++;

      onMount(() => {
        testFnA("mounted", instanceId);
        testFnB("mounted", instanceId);
        return () => {
          testFnA("unmounted", instanceId);
          testFnB("unmounted", instanceId);
        };
      });
      testFnA("created", instanceId);
      testFnB("created", instanceId);
      return { testFnA, testFnB };
    });

    const injector = createInjector();
    const mockFnA = vi.fn();
    const scopeTupleA: AnyScopeTuple = [ExampleScopeA, mockFnA];
    const mockFnB = vi.fn();
    const scopeTupleB: AnyScopeTuple = [ExampleScopeB, mockFnB];
    const mockFnC = vi.fn();
    const scopeTupleC: AnyScopeTuple = [ExampleScopeB, mockFnC];

    const [value1, unsub] = injector.use(
      ExampleCleanupMolecule,
      scopeTupleA,
      scopeTupleB
    );
    expect(value1.testFnA).toBe(mockFnA);
    expect(value1.testFnB).toBe(mockFnB);

    expect(mockFnA).toHaveBeenCalledTimes(2);
    expect(mockFnA).toHaveBeenNthCalledWith(1, "created", 1);
    expect(mockFnA).toHaveBeenNthCalledWith(2, "mounted", 1);

    expect(mockFnB).toHaveBeenCalledTimes(2);
    expect(mockFnB).toHaveBeenNthCalledWith(1, "created", 1);
    expect(mockFnB).toHaveBeenNthCalledWith(2, "mounted", 1);

    const [value2, unsub2] = injector.use(
      ExampleCleanupMolecule,
      scopeTupleA,
      scopeTupleC
    );
    expect(value2.testFnA).toBe(mockFnA);
    expect(value2.testFnB).toBe(mockFnC);

    expect(mockFnA).toHaveBeenCalledTimes(4);
    expect(mockFnA).toHaveBeenNthCalledWith(3, "created", 2);
    expect(mockFnA).toHaveBeenNthCalledWith(4, "mounted", 2);

    expect(mockFnC).toHaveBeenCalledTimes(2);
    expect(mockFnC).toHaveBeenNthCalledWith(1, "created", 2);
    expect(mockFnC).toHaveBeenNthCalledWith(2, "mounted", 2);

    unsub2();
    expect(mockFnA).toHaveBeenCalledTimes(5);
    expect(mockFnA).toHaveBeenNthCalledWith(5, "unmounted", 2);

    expect(mockFnC).toHaveBeenCalledTimes(3);
    expect(mockFnC).toHaveBeenNthCalledWith(3, "unmounted", 2);

    unsub();

    expect(mockFnA).toHaveBeenNthCalledWith(6, "unmounted", 1);
    expect(mockFnA.mock.calls).toStrictEqual([
      ["created", 1],
      ["mounted", 1],
      ["created", 2],
      ["mounted", 2],
      ["unmounted", 2],
      ["unmounted", 1],
    ]);
    expect(mockFnB).toHaveBeenNthCalledWith(3, "unmounted", 1);
    expect(mockFnB).toHaveBeenCalledTimes(3);
  });
});

test("Can't use `mounted` hook in globally scoped molecule", () => {
  const testFn = vi.fn();

  const ExampleCleanupMolecule = molecule(() => {
    onMount(() => {
      testFn("mounted");
      return () => testFn("unmounted");
    });
    testFn("created");
    return testFn;
  });

  const injector = createInjector();

  // FIXME: Would be very handy to be able to use globally scoped molecules
  expect(() => injector.get(ExampleCleanupMolecule)).toThrowError();
});
