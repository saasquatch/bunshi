import { vi } from "vitest";
import { ComponentScope } from ".";
import { createLifecycleUtils } from "../shared/testing/lifecycle";
import { createInjector } from "./injector";
import { AnyScopeTuple } from "./internal/internal-types";
import { onMount, onUnmount, use } from "./lifecycle";
import { molecule } from "./molecule";
import { createScope } from "./scope";
import {
  ConfigMolecule,
  ConfigScope,
  LibaryMolecule,
} from "./testing/test-molecules";

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
  use(TransientScopeMolecule),
);

let injector = createInjector({});

beforeEach(() => {
  // Reset injector state
  injector = createInjector({
    // instrumentation: new LoggingInstrumentation(),
  });
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
    },
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
      // Molecule return type is not inferred
      const testFn = use(BaseMolecule);

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
      // Creates happen forst
      ["base", "created"],
      ["derived", "created"],
      // Mounts happen as a second pass
      ["base", "mounted"],
      ["derived", "mounted"],
    ];
    expect(mockFn.mock.calls).toStrictEqual(expectedCalls1);

    unsub();

    expect(mockFn.mock.calls).toStrictEqual([
      ...expectedCalls1,
      /**
       * Unmounts are called in reverse order to
       */
      ["derived", "unmounted"],
      ["base", "unmounted"],
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
      scopeTupleB,
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
      scopeTupleC,
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
  const lifecycle = createLifecycleUtils();
  const ExampleCleanupMolecule = molecule(() => {
    const uniqueValue = Math.random();
    lifecycle.connect(uniqueValue);
    return uniqueValue;
  });

  const injector = createInjector();

  lifecycle.expectUncalled();
  const [value, unsub] = injector.use(ExampleCleanupMolecule);
  lifecycle.expectActivelyMounted();

  unsub();

  lifecycle.expectToHaveBeenCalledTimes(1);
  lifecycle.expectToMatchCalls([value]);
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

  const lifecycle = createLifecycleUtils();

  const ConditionalMolecule = molecule(() => {
    const enabled = use(IsEnabled);

    let comp: any = undefined;
    if (enabled) {
      comp = use(ComponentScope);
    }

    lifecycle.connect(enabled, comp);

    return [enabled, comp];
  });
  const componentA = Symbol("component-a");
  // const componentB = Symbol("component-b");

  test("From 2 to 1 dependency", () => {
    const injector = createInjector();

    lifecycle.expectUncalled();

    // First iteration should have 2 scope dependencies
    const case1 = injector.use(
      ConditionalMolecule,
      [IsEnabled, true],
      [ComponentScope, componentA],
    );

    expect(case1[0]).toStrictEqual([true, componentA]);
    expect(lifecycle.mounts).toHaveBeenLastCalledWith(true, componentA);
    expect(lifecycle.executions).toBeCalledTimes(1);

    // 2nd iteration should only have 1 scope dependency
    expect(() =>
      injector.use(ConditionalMolecule, [IsEnabled, false]),
    ).toThrow();
  });

  test("From 1 to 2 dependencies", () => {
    const injector = createInjector();

    // 1st iteration should only have 1 scope dependency
    const case2 = injector.use(ConditionalMolecule, [IsEnabled, false]);
    expect(case2[0]).toStrictEqual([false, undefined]);
    expect(lifecycle.mounts).toHaveBeenLastCalledWith(false, undefined);
    expect(lifecycle.executions).toHaveBeenLastCalledWith(false, undefined);
    expect(lifecycle.mounts).toHaveBeenCalledTimes(1);
    expect(lifecycle.executions).toHaveBeenCalledTimes(1);

    // 2nd iteration should have 2 scope dependencies
    expect(() =>
      injector.use(
        ConditionalMolecule,
        [IsEnabled, true],
        [ComponentScope, componentA],
      ),
    ).toThrow();
  });

  test("Kitchen sink", () => {
    const injector = createInjector();

    // When the molecule is used without scopes
    injector.use(ConditionalMolecule);
    // Then it is executed
    expect(lifecycle.executions).toHaveBeenCalledTimes(1);
    // When the molecule is used with the default scope value (passed explicitly)
    injector.use(ConditionalMolecule, [IsEnabled, false]);
    // Then it is NOT executed again
    expect(lifecycle.executions).toHaveBeenCalledTimes(1);

    // When the molecule is used with a different scope value
    expect(() =>
      injector.use(ConditionalMolecule, [IsEnabled, true]),
    ).toThrow();
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

      lifecycle.executions(use(IsEnabled), comp);
      return [use(IsEnabled), comp];
    });

    test("From B to A", () => {
      const injector = createInjector();

      expect(injector.use(TwoForks)[0]).toStrictEqual([false, "b1"]);
      expect(() => injector.use(TwoForks, [IsEnabled, true])).toThrow();
    });

    test("From A to B", () => {
      const injector = createInjector();

      expect(injector.use(TwoForks, [IsEnabled, true])[0]).toStrictEqual([
        true,
        "a1",
      ]);
      expect(() => injector.use(TwoForks)).toThrow();
    });
  });

  describe("Required scope is a molecule", () => {
    test("Use the molecule, expect error", () => {
      const injector = createInjector();
      expect(() => injector.use(LibaryMolecule)).toThrow();
    });
    test("Non-conditional path works", () => {
      const injector = createInjector();
      const [library, unsub1] = injector.use(LibaryMolecule, [
        ConfigScope,
        ConfigMolecule,
      ]);
      const [config, unsub2] = injector.use(ConfigMolecule);
      expect(library.example).toBe(config.example);
      unsub1();
      unsub2();
    });
  });
});

describe("unmount lifecycle", () => {
  const unmountInternal = vi.fn();

  beforeEach(() => {
    unmountInternal.mockReset();
  });

  const OnlyUnmount = molecule(() => {
    use(ExampleScope);
    onUnmount(() => unmountInternal());
  });

  const TwoUnmounts = molecule(() => {
    use(ExampleScope);
    onUnmount(() => {
      /* no-op */
    });
    onUnmount(() => unmountInternal());
  });

  const ThreeUnmounts = molecule(() => {
    use(ExampleScope);
    onUnmount(() => {
      /* no-op */
    });
    onUnmount(() => unmountInternal());
    onUnmount(() => {
      /* no-op */
    });
  });

  const ReturnedFromMount = molecule(() => {
    use(ExampleScope);
    onMount(() => {
      return () => unmountInternal();
    });
  });

  const ReturnedFrom2ndMount = molecule(() => {
    use(ExampleScope);
    onMount(() => {});
    onMount(() => {
      return () => unmountInternal();
    });
  });

  test.each([
    { moleculeToTest: OnlyUnmount, case: "only one unmount" },
    { moleculeToTest: TwoUnmounts, case: "two unmounts" },
    { moleculeToTest: ThreeUnmounts, case: "three unmount" },
    {
      moleculeToTest: ReturnedFromMount,
      case: "unmount from the mount function",
    },
    {
      moleculeToTest: ReturnedFrom2ndMount,
      case: "unmount from a 2nd mount function",
    },
  ])("$case", ({ moleculeToTest }) => {
    const [_, unsub] = injector.use(moleculeToTest);
    expect(unmountInternal).not.toHaveBeenCalled();
    unsub();
    expect(unmountInternal).toHaveBeenCalledOnce();
  });

  describe("Errors in unmount calls are handled silently", () => {
    beforeEach(() => {
      unmountInternal.mockImplementationOnce(() => {
        throw new Error("thrown error");
      });
    });

    test.each([
      { moleculeToTest: OnlyUnmount, case: "only one unmount" },
      { moleculeToTest: TwoUnmounts, case: "two unmounts" },
      { moleculeToTest: ThreeUnmounts, case: "three unmount" },
      {
        moleculeToTest: ReturnedFromMount,
        case: "unmount from the mount function",
      },
      {
        moleculeToTest: ReturnedFrom2ndMount,
        case: "unmount from a 2nd mount function",
      },
    ])("$case", ({ moleculeToTest }) => {
      const [_, unsub] = injector.use(moleculeToTest);
      expect(unmountInternal).not.toHaveBeenCalled();
      expect(() => unsub()).toThrow();
      expect(unmountInternal).toHaveBeenCalledOnce();
    });
  });
});

describe("lifecycle API", () => {
  test.each([{ fn: use }, { fn: onMount }, { fn: onUnmount }])(
    "Can't use outside molecule",
    ({ fn }) => {
      expect(fn).toThrow();
    },
  );
});

describe("Repeated leases work", () => {
  const globalLifecycle = createLifecycleUtils();
  const GlobalMolecule = molecule(() => {
    const value = { number: Math.random() };
    globalLifecycle.connect(value);
    return value;
  });

  const scopedLifeycle = createLifecycleUtils();
  const testScope = createScope(undefined);
  const ScopedMolecule = molecule(() => {
    use(testScope);
    const value = { number: Math.random() };
    scopedLifeycle.connect(value);
    return value;
  });

  const DerivedMolecule = molecule(() => use(ScopedMolecule));

  const DoubleDerived = molecule(() => {
    use(GlobalMolecule);
    return use(ScopedMolecule);
  });

  // TODO: Add more test suites for other scopes (component scope, custom scopes) and molecule combinations
  test.each([
    {
      case: "Global",
      run: () => injector.use(GlobalMolecule),
      lifecycle: globalLifecycle,
    },
    {
      case: "Scoped",
      run: () => injector.use(ScopedMolecule, [testScope, "abc"]),
      lifecycle: scopedLifeycle,
    },
    {
      case: "Derived",
      run: () => injector.use(DerivedMolecule, [testScope, "abcq"]),
      lifecycle: scopedLifeycle,
    },
    {
      case: "Double Derived",
      run: () => injector.use(DoubleDerived, [testScope, "abcdef"]),
      lifecycle: scopedLifeycle,
    },
  ])("Case: $case", ({ run, lifecycle }) => {
    // Loop a bunch of times
    for (let iteration = 0; iteration < 10; iteration++) {
      lifecycle.expectUncalled();
      const [value, unsub] = run();
      lifecycle.expectActivelyMounted();
      unsub();
      lifecycle.expectToMatchCalls([value]);
      lifecycle.reset();
    }
  });
});

describe("Repeated lazy leases work", () => {
  const globalLifecycle = createLifecycleUtils();
  const GlobalMolecule = molecule(() => {
    const value = { number: Math.random() };
    globalLifecycle.connect(value);
    return value;
  });

  const scopedLifeycle = createLifecycleUtils();
  const testScope = createScope(undefined);
  const ScopedMolecule = molecule(() => {
    use(testScope);
    const value = { number: Math.random() };
    scopedLifeycle.connect(value);
    return value;
  });

  const DerivedMolecule = molecule(() => use(ScopedMolecule));

  const DoubleDerived = molecule(() => {
    use(GlobalMolecule);
    return use(ScopedMolecule);
  });

  // TODO: Add more test suites for other scopes (component scope, custom scopes) and molecule combinations
  test.each([
    {
      case: "Global",
      run: () => injector.useLazily(GlobalMolecule),
      lifecycle: globalLifecycle,
    },
    {
      case: "Scoped",
      run: () => injector.useLazily(ScopedMolecule, [testScope, "abc"]),
      lifecycle: scopedLifeycle,
    },
    {
      case: "Derived",
      run: () => injector.useLazily(DerivedMolecule, [testScope, "abcq"]),
      lifecycle: scopedLifeycle,
    },
    {
      case: "Double Derived",
      run: () => injector.useLazily(DoubleDerived, [testScope, "abcdef"]),
      lifecycle: scopedLifeycle,
    },
  ])("Case: $case", ({ run, lifecycle }) => {
    // Loop a bunch of times
    for (let iteration = 0; iteration < 10; iteration++) {
      lifecycle.reset();

      lifecycle.expectUncalled();
      const [value, handle] = run();
      lifecycle.expectRunButUnmounted();

      const value1 = handle.start();
      lifecycle.expectActivelyMounted();

      // Then it uses the original value from the subscription
      expect(value1).toBe(value);

      handle.stop();
      lifecycle.expectToMatchCalls([value]);
      lifecycle.reset();

      // When the subscription is restarted
      const value2 = handle.start();
      // Then the first value is re-used instead of a new one being used
      expect(value2).toBe(value);

      // And the molecule is not executed
      // because the value was re-used
      expect(lifecycle.executions).not.toHaveBeenCalled();
      // And the mount lifecycle is called
      // because it needs to know that the subscription is active
      expect(lifecycle.mounts).toHaveBeenCalled();
      // And the unmount lifecycle is called
      expect(lifecycle.unmounts).not.toHaveBeenCalled();

      handle.stop();

      expect(lifecycle.executions).not.toHaveBeenCalled();
      expect(lifecycle.mounts.mock.calls).toStrictEqual([[value]]);
      expect(lifecycle.unmounts.mock.calls).toStrictEqual([[value]]);
    }
  });
});
