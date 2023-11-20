import { vi } from "vitest";
import { ComponentScope } from ".";
import { createInjector } from "./injector";
import { AnyScopeTuple } from "./internal/internal-types";
import { onMount, use } from "./lifecycle";
import { molecule } from "./molecule";
import { createScope } from "./scope";

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

const TransientScopeMolecule = molecule(() => use(ExampleCleanupMolecule));
const SecondOrderTransientMolecule = molecule(() =>
  use(TransientScopeMolecule)
);

let injector = createInjector();

beforeEach(() => {
  // Reset injector state
  injector = createInjector();
  defaultFn.mockReset();
});

describe("Single scope dependencies", () => {
  test("Default scope values are cleaned up", () => {
    const [value, unsub] = injector.use(ExampleCleanupMolecule);
    expect(value).toBe(defaultFn);
    expect(defaultFn).toHaveBeenNthCalledWith(1, "created");
    expect(defaultFn).toHaveBeenNthCalledWith(2, "mounted");

    unsub();
    expect(defaultFn).toHaveBeenCalledTimes(3);
    expect(defaultFn).toHaveBeenNthCalledWith(3, "unmounted");
  });

  describe.each([
    { case: "Direct scope", MoleculeToTest: ExampleCleanupMolecule },
    { case: "Transient scope", MoleculeToTest: TransientScopeMolecule },
    {
      case: "2nd Order Transient scope",
      MoleculeToTest: SecondOrderTransientMolecule,
    },
  ])(
    "Default scope leases in a $case molecule are extended after multiple calls, then cleaned up",
    // Given a molecule that can be observed
    ({ MoleculeToTest }) => {
      test.each([
        {
          case: "Both calls are implicit",
          scopes1: undefined,
          scopes2: undefined,
        },
        {
          case: "2nd call is explicit",
          scopes1: undefined,
          scopes2: [ExampleScope, defaultFn],
        },
        {
          case: "1st call is explicit",
          scopes1: [ExampleScope, defaultFn],
          scopes2: undefined,
        },
        {
          case: "both calls are explicit",
          scopes1: [ExampleScope, defaultFn],
          scopes2: [ExampleScope, defaultFn],
        },
      ])("Case: $case", ({ scopes1, scopes2 }: any) => {
        // Given an empty case
        expect(defaultFn).toHaveBeenCalledTimes(0);

        // When the molecule is used
        const [value1, unsub1] = scopes1
          ? injector.use(MoleculeToTest, scopes1)
          : injector.use(MoleculeToTest);

        // Then it returns the right value
        expect(value1).toBe(defaultFn);

        // And it's callback function is called (i.e. `created`)
        expect(defaultFn).toHaveBeenNthCalledWith(1, "created");
        // And it's `mounted` lifecycle hooks are called
        expect(defaultFn).toHaveBeenNthCalledWith(2, "mounted");

        // When the molecule is used again
        const [value2, unsub2] = scopes2
          ? injector.use(MoleculeToTest, scopes2)
          : injector.use(MoleculeToTest);

        // Then it returns the right value
        expect(value2).toBe(defaultFn);

        // Then no more molecules are created
        expect(defaultFn).toHaveBeenCalledTimes(2);

        // When the first subscription is released
        unsub1();

        // Then clean is not called
        expect(defaultFn).toHaveBeenCalledTimes(2);

        // When the second subscription is released
        unsub2();

        // Then there are no more subscriptions for default scope
        // And the cleanups are called
        expect(defaultFn).toHaveBeenCalledTimes(3);
        expect(defaultFn).toHaveBeenNthCalledWith(3, "unmounted");
      });
    }
  );

  test("Derived molecules are cleaned up", () => {
    const BaseMolecule = molecule(() => {
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
      const testFn = use<Function>(BaseMolecule);

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
    const mockFn = vi.fn();
    const scopeTuple: AnyScopeTuple = [ExampleScope, mockFn];

    const [value, unsub] = injector.use(ExampleCleanupMolecule, scopeTuple);
    expect(value).toBe(mockFn);
    expect(mockFn).toHaveBeenNthCalledWith(1, "created");
    expect(mockFn).toHaveBeenNthCalledWith(2, "mounted");

    const [value2, unsub2] = injector.use(ExampleCleanupMolecule, scopeTuple);
    expect(value2).toBe(mockFn);
    expect(mockFn).toHaveBeenCalledTimes(2);

    unsub2();
    expect(mockFn).toHaveBeenCalledTimes(2);

    unsub();
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(mockFn).toHaveBeenNthCalledWith(3, "unmounted");
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

describe("Conditional dependencies", () => {
  /**
   * Types of conditional dependency checks
   *
   * - Direction of conditions changing
   * -- Expanding conditional scope (starts with 1 then grows)
   * -- Shrinking conditional scopes (started with many, then reduces)
   * -- Swapped scopes (i.e. from Scope A to Scope B)
   * - Default scopes
   * -- Default scope value as the ternary / switch in the if statement
   * -- Default scope used in a branch
   * -- Default scopes used in all the permutations above
   * - Lifecyle hooks
   * -- Make sure all the above cases support onMount and onUnmount lifecycles
   */

  const IsEnabled = createScope(false);

  const executions = vi.fn();
  const mounts = vi.fn();
  const unmounts = vi.fn();
  const localOrGlobal = molecule(() => {
    const enabled = use(IsEnabled);

    let comp: any = undefined;
    if (enabled) {
      comp = use(ComponentScope);
    }

    executions(enabled, comp);

    onMount(() => {
      mounts(enabled, comp);
      return () => unmounts(enabled, comp);
    });

    return [enabled, comp];
  });
  const componentA = Symbol();
  const componentB = Symbol();

  afterEach(() => {
    executions.mockReset();
    mounts.mockReset();
    unmounts.mockReset();
  });

  test("From 2 to 1 dependency", () => {
    const injector = createInjector();

    // First iteration should have 2 scope dependencies

    const case1 = injector.use(
      localOrGlobal,
      [IsEnabled, true],
      [ComponentScope, componentA]
    );

    expect(case1[0]).toStrictEqual([true, componentA]);
    expect(mounts).toHaveBeenLastCalledWith(true, componentA);
    expect(executions).toBeCalledTimes(1);

    // 2nd iteration should only have 1 scope dependency
    const case2 = injector.use(localOrGlobal, [IsEnabled, false]);
    expect(case2[0]).toStrictEqual([false, undefined]);
    expect(mounts).toHaveBeenLastCalledWith(false, undefined);
    expect(executions).toBeCalledTimes(2);

    // 3rd iteration should have 2 scope dependencies
    const case3 = injector.use(
      localOrGlobal,
      [IsEnabled, true],
      [ComponentScope, componentA]
    );
    expect(case3[0]).toStrictEqual([true, componentA]);

    // this should be cached, so no more molecule creations
    expect(executions).toBeCalledTimes(2);

    // 4th iteration should use only 1 scope dependency
    const case4 = injector.use(localOrGlobal, [IsEnabled, false]);
    expect(case4[0]).toStrictEqual([false, undefined]);

    // this should be cached, so no more molecule creations
    expect(executions).toBeCalledTimes(2);

    case1[1]();
    case3[1]();

    case2[1]();
    case4[1]();

    expect(unmounts.mock.calls).toStrictEqual([
      [true, componentA],
      [false, undefined],
    ]);
  });

  test("From 1 to 2 dependencies", () => {
    const injector = createInjector();

    // 1st iteration should only have 1 scope dependency
    const case2 = injector.use(localOrGlobal, [IsEnabled, false]);
    expect(case2[0]).toStrictEqual([false, undefined]);
    expect(mounts).toHaveBeenLastCalledWith(false, undefined);
    expect(executions).toBeCalledTimes(1);

    // end iteration should have 2 scope dependencies
    const case1 = injector.use(
      localOrGlobal,
      [IsEnabled, true],
      [ComponentScope, componentA]
    );
    expect(case1[0]).toStrictEqual([true, componentA]);
    expect(mounts).toHaveBeenLastCalledWith(true, componentA);
    expect(executions).toBeCalledTimes(2);

    // 3rd iteration should have 2 scope dependencies
    const case3 = injector.use(
      localOrGlobal,
      [IsEnabled, true],
      [ComponentScope, componentA]
    );
    expect(case3[0]).toStrictEqual([true, componentA]);

    // this should be cached, so no more molecule creations
    expect(executions).toBeCalledTimes(2);

    // 4th iteration should use only 1 scope dependency
    const case4 = injector.use(localOrGlobal, [IsEnabled, false]);
    expect(case4[0]).toStrictEqual([false, undefined]);

    // this should be cached, so no more molecule creations
    expect(executions).toBeCalledTimes(2);

    // No unmounts yet
    expect(unmounts).toHaveBeenCalledTimes(0);

    // Unsub from both subscribers
    case2[1]();
    case4[1]();

    // Expect the scope to be cleaned up
    expect(unmounts).toHaveBeenLastCalledWith(false, undefined);

    // Unsub from both subscribers
    case1[1]();
    case3[1]();

    // Expect the scope to be cleaned up
    expect(unmounts).toHaveBeenLastCalledWith(true, componentA);

    // Only two umounts called, so we aren't doing unrelated unmounts
    expect(unmounts).toHaveBeenCalledTimes(2);
  });

  test("Kitchen sink", () => {
    const injector = createInjector();

    // When the molecule is used without scopes
    const case0 = injector.use(localOrGlobal);
    // Then it is executed
    expect(executions).toHaveBeenCalledTimes(1);
    // When the molecule is used with the default scope value (passed explicitly)
    const case1 = injector.use(localOrGlobal, [IsEnabled, false]);
    // Then it is NOT executed again
    expect(executions).toHaveBeenCalledTimes(1);

    // When the molecule is used with a different scope value
    const case2 = injector.use(localOrGlobal, [IsEnabled, true]);
    // Then it is executed
    expect(executions).toHaveBeenCalledTimes(2);

    const case3 = injector.use(
      localOrGlobal,
      [IsEnabled, false],
      [ComponentScope, componentA]
    );
    const case4 = injector.use(
      localOrGlobal,
      [IsEnabled, false],
      [ComponentScope, componentB]
    );
    const case5 = injector.use(
      localOrGlobal,
      [IsEnabled, true],
      [ComponentScope, componentA]
    );
    const case6 = injector.use(
      localOrGlobal,
      [IsEnabled, true],
      [ComponentScope, componentB]
    );

    expect(case0[0]).toStrictEqual([false, undefined]);
    expect(case1[0]).toStrictEqual([false, undefined]);
    expect(case2[0]).toStrictEqual([true, undefined]);
    expect(case3[0]).toStrictEqual([false, undefined]);
    expect(case4[0]).toStrictEqual([false, undefined]);
    expect(case5[0]).toStrictEqual([true, componentA]);
    expect(case6[0]).toStrictEqual([true, componentB]);

    expect(executions).toHaveBeenCalledTimes(6);

    // When the molecules are re-used
    expect(injector.use(localOrGlobal)[0]).toStrictEqual([false, undefined]);
    expect(injector.use(localOrGlobal, [IsEnabled, false])[0]).toStrictEqual([
      false,
      undefined,
    ]);
    expect(injector.use(localOrGlobal, [IsEnabled, true])[0]).toStrictEqual([
      true,
      undefined,
    ]);
    expect(
      injector.use(
        localOrGlobal,
        [IsEnabled, false],
        [ComponentScope, componentA]
      )[0]
    ).toStrictEqual([false, undefined]);
    expect(
      injector.use(
        localOrGlobal,
        [IsEnabled, false],
        [ComponentScope, componentB]
      )[0]
    ).toStrictEqual([false, undefined]);
    expect(
      injector.use(
        localOrGlobal,
        [IsEnabled, true],
        [ComponentScope, componentA]
      )[0]
    ).toStrictEqual([true, componentA]);
    expect(
      injector.use(
        localOrGlobal,
        [IsEnabled, true],
        [ComponentScope, componentB]
      )[0]
    ).toStrictEqual([true, componentB]);

    // Then no more executions are used
    // Because they should all be cached
    expect(executions).toHaveBeenCalledTimes(6);
  });

  /**
   * These set of tests help check the order of operations.
   *
   * Since the internal dependencies for a molecule are cached
   * by an ever-growing set of possible dependencies, the
   * order of operations could matter.
   *
   * These test should prove that the order of operations
   * does NOT matter.
   */
  describe("Two forks: A or B", () => {
    const ScopeA = createScope("a1");
    const ScopeB = createScope("b1");
    const TwoForks = molecule(() => {
      let comp;
      if (use(IsEnabled)) {
        comp = use(ScopeA);
      } else {
        comp = use(ScopeB);
      }

      executions(use(IsEnabled), comp);
      return [use(IsEnabled), comp];
    });

    test("From B to A", () => {
      const injector = createInjector();

      expect(injector.use(TwoForks)[0]).toStrictEqual([false, "b1"]);
      expect(injector.use(TwoForks, [IsEnabled, true])[0]).toStrictEqual([
        true,
        "a1",
      ]);

      expect(executions).toHaveBeenCalledTimes(2);

      expect(injector.use(TwoForks)[0]).toStrictEqual([false, "b1"]);
      expect(injector.use(TwoForks, [IsEnabled, true])[0]).toStrictEqual([
        true,
        "a1",
      ]);

      expect(executions).toHaveBeenCalledTimes(2);
    });

    test("From A to B", () => {
      const injector = createInjector();

      expect(injector.use(TwoForks, [IsEnabled, true])[0]).toStrictEqual([
        true,
        "a1",
      ]);
      expect(injector.use(TwoForks)[0]).toStrictEqual([false, "b1"]);

      expect(executions).toHaveBeenCalledTimes(2);

      expect(injector.use(TwoForks)[0]).toStrictEqual([false, "b1"]);
      expect(injector.use(TwoForks, [IsEnabled, true])[0]).toStrictEqual([
        true,
        "a1",
      ]);

      expect(executions).toHaveBeenCalledTimes(2);
    });
  });
});
