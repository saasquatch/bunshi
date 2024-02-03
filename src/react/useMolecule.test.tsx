import { renderHook } from "@testing-library/react";
import React, { StrictMode, useContext } from "react";
import { createScope, molecule, use } from ".";
import { createLifecycleUtils } from "../shared/testing/lifecycle";
import { ScopeProvider } from "./ScopeProvider";
import { ScopeContext } from "./contexts/ScopeContext";
import { strictModeSuite } from "./testing/strictModeSuite";
import { useMolecule } from "./useMolecule";

export const UserScope = createScope("user@example.com", {
  debugLabel: "User Scope",
});

const userMoleculeLifecycle = createLifecycleUtils();
export const UserMolecule = molecule((_, getScope) => {
  const userId = getScope(UserScope);

  const value = {
    random: Math.random(),
    userId,
  };
  userMoleculeLifecycle.connect(value);
  return value;
});

strictModeSuite(({ wrapper, isStrict }) => {
  describe("useMolecule", () => {
    test("Use molecule can have scope provided", () => {
      const useUserMolecule = () => {
        return {
          molecule: useMolecule(UserMolecule, {
            withScope: [UserScope, "jeffrey@example.com"],
          }),
        };
      };
      const { result } = renderHook(useUserMolecule, {});

      expect(result.current.molecule.userId).toBe("jeffrey@example.com");
    });
    test("Provided scope ignores wrappers scope", () => {
      const Wrapper = ({ children }: { children?: React.ReactNode }) => (
        <ScopeProvider scope={UserScope} value={"sam@example.com"}>
          {children}
        </ScopeProvider>
      );

      const useUserMolecule = () => {
        return {
          molecule: useMolecule(UserMolecule, {
            withScope: [UserScope, "jeffrey@example.com"],
          }),
          context: useContext(ScopeContext),
        };
      };
      const { result } = renderHook(useUserMolecule, {
        wrapper: Wrapper,
      });

      expect(result.current.context).toStrictEqual([
        [UserScope, "sam@example.com"],
      ]);
      expect(result.current.molecule.userId).toBe("jeffrey@example.com");
    });

    test("Exclusive scope ignores wrappers scope", () => {
      const Wrapper = ({ children }: { children?: React.ReactNode }) => (
        <ScopeProvider scope={UserScope} value={"implicit@example.com"}>
          {children}
        </ScopeProvider>
      );

      const useUserMolecule = () => {
        return {
          molecule: useMolecule(UserMolecule, {
            exclusiveScope: [UserScope, "exclusive@example.com"],
          }),
          context: useContext(ScopeContext),
        };
      };
      const { result } = renderHook(useUserMolecule, {
        wrapper: Wrapper,
      });

      expect(result.current.context).toStrictEqual([
        [UserScope, "implicit@example.com"],
      ]);
      expect(result.current.molecule.userId).toBe("exclusive@example.com");
    });

    test("Unique scope will generate a new value for each use", () => {
      const useUserMolecule = () => {
        return {
          molecule1: useMolecule(UserMolecule, {
            withUniqueScope: UserScope,
          }),
          molecule2: useMolecule(UserMolecule, {
            withUniqueScope: UserScope,
          }),
        };
      };
      const { result } = renderHook(useUserMolecule, {});

      expect(result.current.molecule1.userId).not.toBe(
        result.current.molecule2.userId,
      );
    });

    test("Empty options breaks nothing", () => {
      const useUserMolecule = () => {
        return {
          molecule: useMolecule(UserMolecule, {}),
        };
      };
      const { result } = renderHook(useUserMolecule, {});

      expect(result.current.molecule.userId).toBe("user@example.com");
    });

    describe("Lifecyle hooks run with React", () => {
      const moleculeLifecycle = createLifecycleUtils();
      const UseLifecycleMolecule = molecule(() => {
        const userId = use(UserScope);
        moleculeLifecycle.connect(userId);
        return userId;
      });

      const jeffrey = "jeffrey@example.com";
      const useUserMolecule = () => {
        return {
          molecule: useMolecule(UseLifecycleMolecule, {
            withScope: [UserScope, jeffrey],
          }),
        };
      };

      test("Works with withScope", () => {
        expectUserLifecycle(useUserMolecule, jeffrey);
      });

      test("Works with exclusiveScope", () => {
        const testHook = () => {
          return {
            molecule: useMolecule(UseLifecycleMolecule, {
              exclusiveScope: [UserScope, jeffrey],
            }),
          };
        };
        expectUserLifecycle(testHook, jeffrey);
      });

      test("Works with default scope", () => {
        /**
         * Default tuples are better memoized, so the default assumptions for number of execution in `expectUserLifecycle` aren't valid
         *
         * Default tuples can a molecule to only be executed once in strict mode instead of twice.
         *
         * This is because the tuple itself is a global constant, so it is shared between strict mode renders.
         *
         * Non-default scope tuples are not global constants, so they are not shared between strict mode renders.
         */
        const testHook = () => {
          return {
            molecule: useMolecule(UseLifecycleMolecule),
          };
        };
        const expectedUser = UserScope.defaultValue;

        moleculeLifecycle.expectUncalled();

        const run1 = renderHook(testHook, {
          wrapper,
        });

        if (isStrict) {
          moleculeLifecycle.expectCalledTimesEach(1, 2, 1);
        } else {
          moleculeLifecycle.expectCalledTimesEach(1, 1, 0);
        }

        expect(run1.result.current.molecule).toBe(expectedUser);

        const run2 = renderHook(testHook, {
          wrapper,
        });

        if (isStrict) {
          moleculeLifecycle.expectCalledTimesEach(1, 2, 1);
        } else {
          moleculeLifecycle.expectCalledTimesEach(1, 1, 0);
        }
        expect(run2.result.current.molecule).toBe(expectedUser);

        run1.unmount();

        if (isStrict) {
          moleculeLifecycle.expectCalledTimesEach(1, 2, 1);
        } else {
          moleculeLifecycle.expectCalledTimesEach(1, 1, 0);
        }

        run2.unmount();

        if (isStrict) {
          moleculeLifecycle.expectCalledTimesEach(1, 2, 2);
        } else {
          moleculeLifecycle.expectCalledTimesEach(1, 1, 1);
        }
      });

      function expectUserLifecycle(
        testHook: typeof useUserMolecule,
        expectedUser: string,
      ) {
        moleculeLifecycle.expectUncalled();

        const run1 = renderHook(testHook, {
          wrapper,
        });

        if (isStrict) {
          moleculeLifecycle.expectCalledTimesEach(2, 2, 1);
        } else {
          moleculeLifecycle.expectCalledTimesEach(1, 1, 0);
        }

        expect(run1.result.current.molecule).toBe(expectedUser);

        const run2 = renderHook(testHook, {
          wrapper,
        });

        if (isStrict) {
          moleculeLifecycle.expectCalledTimesEach(2, 2, 1);
        } else {
          moleculeLifecycle.expectCalledTimesEach(1, 1, 0);
        }
        expect(run2.result.current.molecule).toBe(expectedUser);

        run1.unmount();

        if (isStrict) {
          moleculeLifecycle.expectCalledTimesEach(2, 2, 1);
        } else {
          moleculeLifecycle.expectCalledTimesEach(1, 1, 0);
        }

        run2.unmount();

        if (isStrict) {
          moleculeLifecycle.expectCalledTimesEach(2, 2, 2);
        } else {
          moleculeLifecycle.expectCalledTimesEach(1, 1, 1);
        }
      }
    });

    test("Empty", () => {});
  });
});

describe("Parallel calls", () => {
  const renders = vi.fn();
  beforeEach(() => renders.mockReset());

  test("Parallel renders in different components", () => {
    userMoleculeLifecycle.expectUncalled();

    const useUserMolecule = () =>
      useMolecule(UserMolecule, {
        withScope: [UserScope, "jeffrey@example.com"],
      });

    const render1 = renderHook(useUserMolecule, {});
    userMoleculeLifecycle.expectActivelyMounted();
    const render2 = renderHook(useUserMolecule, {});
    userMoleculeLifecycle.expectActivelyMounted();

    expect(render1.result.current.userId).toBe("jeffrey@example.com");
    expect(render2.result.current.userId).toBe("jeffrey@example.com");
    expect(render2.result.current).toBe(render1.result.current);

    render1.unmount();
    render2.unmount();

    expect(render1.result.current.userId).toBe("jeffrey@example.com");
    expect(render2.result.current.userId).toBe("jeffrey@example.com");
    expect(render2.result.current).toBe(render1.result.current);
  });

  test("Parallel calls in the same component", () => {
    userMoleculeLifecycle.expectUncalled();

    const useUserMolecule = () => {
      return {
        first: useMolecule(UserMolecule, {
          withScope: [UserScope, "jeffrey@example.com"],
        }),
        second: useMolecule(UserMolecule, {
          withScope: [UserScope, "jeffrey@example.com"],
        }),
      };
    };

    const render1 = renderHook(useUserMolecule, {});
    userMoleculeLifecycle.expectCalledTimesEach(2, 1, 0);

    expect(render1.result.current.first.userId).toBe("jeffrey@example.com");
    expect(render1.result.current.second.userId).toBe("jeffrey@example.com");
    expect(render1.result.current.first).toBe(render1.result.current.second);

    render1.unmount();
    userMoleculeLifecycle.expectCalledTimesEach(2, 1, 1);
  });
  test("Triple parallel calls in the same component", () => {
    userMoleculeLifecycle.expectUncalled();

    const useUserMolecule = () => {
      return {
        first: useMolecule(UserMolecule, {
          withScope: [UserScope, "jeffrey@example.com"],
        }),
        second: useMolecule(UserMolecule, {
          withScope: [UserScope, "jeffrey@example.com"],
        }),
        third: useMolecule(UserMolecule, {
          withScope: [UserScope, "jeffrey@example.com"],
        }),
      };
    };

    const render1 = renderHook(useUserMolecule, {});
    // Then the molecule is executed once per call
    // But only mounted once
    userMoleculeLifecycle.expectCalledTimesEach(3, 1, 0);

    expect(render1.result.current.first.userId).toBe("jeffrey@example.com");
    expect(render1.result.current.second.userId).toBe("jeffrey@example.com");
    expect(render1.result.current.third.userId).toBe("jeffrey@example.com");
    expect(render1.result.current.first).toBe(render1.result.current.second);
    expect(render1.result.current.first).toBe(render1.result.current.third);

    render1.unmount();
    userMoleculeLifecycle.expectCalledTimesEach(3, 1, 1);
  });

  describe("Duplicate calls in the same component, with separate scopes", () => {
    const jeffrey = "jeffrey@example.com";
    const useUserMolecule = () => {
      return {
        first: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
        second: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
      };
    };
    test.each([
      {
        case: "Strict",
        wrapper: StrictMode,
        before: [4, 2, 1] as [number, number, number],
        after: [4, 2, 2] as [number, number, number],
      },
      {
        case: "Non-Strict",
        wrapper: undefined,
        before: [2, 1, 0] as [number, number, number],
        after: [2, 1, 1] as [number, number, number],
      },
    ])("$case", ({ wrapper, before, after }) => {
      userMoleculeLifecycle.expectUncalled();

      const render1 = renderHook(useUserMolecule, { wrapper });
      const current = render1.result.current;

      userMoleculeLifecycle.expectCalledTimesEach(...before);

      expect(current.first.userId).toBe(jeffrey);
      expect(current.second.userId).toBe(jeffrey);
      expect(current.first).toBe(current.second);

      render1.unmount();

      userMoleculeLifecycle.expectCalledTimesEach(...after);
    });
  });

  describe("Triplicate calls in the same component, with separate scopes", () => {
    const jeffrey = "jeffrey@example.com";
    const useUserMolecule = () => {
      return {
        first: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
        second: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
        third: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
      };
    };
    test.each([
      {
        case: "Strict",
        wrapper: StrictMode,
        before: [6, 2, 1] as [number, number, number],
        after: [6, 2, 2] as [number, number, number],
      },
      {
        case: "Non-Strict",
        wrapper: undefined,
        before: [3, 1, 0] as [number, number, number],
        after: [3, 1, 1] as [number, number, number],
      },
    ])("$case", ({ wrapper, before, after }) => {
      userMoleculeLifecycle.expectUncalled();

      const render1 = renderHook(useUserMolecule, { wrapper });
      const current = render1.result.current;

      userMoleculeLifecycle.expectCalledTimesEach(...before);

      expect(current.first.userId).toBe(jeffrey);
      expect(current.second.userId).toBe(jeffrey);
      expect(current.third.userId).toBe(jeffrey);
      expect(current.second).toBe(current.first);
      expect(current.third).toBe(current.first);

      render1.unmount();

      userMoleculeLifecycle.expectCalledTimesEach(...after);
    });
  });

  describe("Quadruplicate calls in the same component, with separate scopes", () => {
    const jeffrey = "jeffrey@example.com";
    const useUserMolecule = () => {
      renders();
      return {
        first: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
        second: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
        third: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
        fourth: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
      };
    };
    test.each([
      {
        case: "Strict",
        wrapper: StrictMode,
        before: [8, 2, 1] as [number, number, number],
        after: [8, 2, 2] as [number, number, number],
        beforeRenders: 4,
        afterRenders: 4 + 2,
      },
      {
        case: "Non-Strict",
        wrapper: undefined,
        before: [4, 1, 0] as [number, number, number],
        after: [4, 1, 1] as [number, number, number],
        beforeRenders: 2,
        afterRenders: 2 + 1,
      },
    ])("$case", ({ wrapper, before, after, beforeRenders, afterRenders }) => {
      userMoleculeLifecycle.expectUncalled();

      const render1 = renderHook(useUserMolecule, { wrapper });
      const current = render1.result.current;

      userMoleculeLifecycle.expectCalledTimesEach(...before);

      expect(current.first.userId).toBe(jeffrey);
      expect(current.second.userId).toBe(jeffrey);
      expect(current.third.userId).toBe(jeffrey);
      expect(current.fourth.userId).toBe(jeffrey);
      expect(current.second).toBe(current.first);
      expect(current.third).toBe(current.first);
      expect(current.fourth).toBe(current.first);
      expect(renders).toHaveBeenCalledTimes(beforeRenders);

      render1.rerender();

      render1.unmount();

      userMoleculeLifecycle.expectCalledTimesEach(...after);
      expect(renders).toHaveBeenCalledTimes(afterRenders);
    });
  });

  describe("Duplicate calls in the same component", () => {
    const useUserMolecule = () => {
      renders();
      return {
        first: useMolecule(UserMolecule),
        second: useMolecule(UserMolecule),
      };
    };
    test.each([
      {
        case: "Strict",
        wrapper: StrictMode,
        before: [1, 2, 1] as [number, number, number],
        after: [1, 2, 2] as [number, number, number],
        beforeRenders: 2,
        afterRenders: 4,
      },
      {
        case: "Non-Strict",
        wrapper: undefined,
        before: [1, 1, 0] as [number, number, number],
        after: [1, 1, 1] as [number, number, number],
        beforeRenders: 1,
        afterRenders: 2,
      },
    ])("$case", ({ wrapper, before, after, beforeRenders, afterRenders }) => {
      userMoleculeLifecycle.expectUncalled();

      const render1 = renderHook(useUserMolecule, { wrapper });
      const current = render1.result.current;

      userMoleculeLifecycle.expectCalledTimesEach(...before);

      expect(current.first.userId).toBe(UserScope.defaultValue);
      expect(current.second.userId).toBe(UserScope.defaultValue);
      expect(current.first).toBe(render1.result.current.second);

      expect(renders).toHaveBeenCalledTimes(beforeRenders);

      render1.rerender();
      expect(renders).toHaveBeenCalledTimes(afterRenders);

      render1.unmount();
      expect(renders).toHaveBeenCalledTimes(afterRenders);

      userMoleculeLifecycle.expectCalledTimesEach(...after);
    });
  });

  describe("Triplicate calls in the same component", () => {
    const useUserMolecule = () => {
      return {
        first: useMolecule(UserMolecule),
        second: useMolecule(UserMolecule),
        third: useMolecule(UserMolecule),
      };
    };
    test.each([
      {
        case: "Strict",
        wrapper: StrictMode,
        before: [1, 2, 1] as [number, number, number],
        after: [1, 2, 2] as [number, number, number],
      },
      {
        case: "Non-Strict",
        wrapper: undefined,
        before: [1, 1, 0] as [number, number, number],
        after: [1, 1, 1] as [number, number, number],
      },
    ])("$case", ({ wrapper, before, after }) => {
      userMoleculeLifecycle.expectUncalled();

      const render1 = renderHook(useUserMolecule, { wrapper });
      const current = render1.result.current;

      userMoleculeLifecycle.expectCalledTimesEach(...before);

      expect(current.first.userId).toBe(UserScope.defaultValue);
      expect(current.second.userId).toBe(UserScope.defaultValue);
      expect(current.third.userId).toBe(UserScope.defaultValue);
      expect(current.first).toBe(render1.result.current.second);
      expect(current.first).toBe(current.third);

      render1.unmount();

      userMoleculeLifecycle.expectCalledTimesEach(...after);
    });
  });

  describe("Quadruplicate calls in the same component", () => {
    const useUserMolecule = () => {
      return {
        first: useMolecule(UserMolecule),
        second: useMolecule(UserMolecule),
        third: useMolecule(UserMolecule),
        fourth: useMolecule(UserMolecule),
      };
    };
    test.each([
      {
        case: "Strict",
        wrapper: StrictMode,
        before: [1, 2, 1] as [number, number, number],
        after: [1, 2, 2] as [number, number, number],
      },
      {
        case: "Non-Strict",
        wrapper: undefined,
        before: [1, 1, 0] as [number, number, number],
        after: [1, 1, 1] as [number, number, number],
      },
    ])("$case", ({ wrapper, before, after }) => {
      userMoleculeLifecycle.expectUncalled();

      const render1 = renderHook(useUserMolecule, { wrapper });
      userMoleculeLifecycle.expectCalledTimesEach(...before);
      const current = render1.result.current;

      expect(current.first.userId).toBe(UserScope.defaultValue);
      expect(current.second.userId).toBe(UserScope.defaultValue);
      expect(current.third.userId).toBe(UserScope.defaultValue);
      expect(current.fourth.userId).toBe(UserScope.defaultValue);
      expect(current.first).toBe(current.second);
      expect(current.first).toBe(current.third);
      expect(current.first).toBe(current.fourth);

      render1.unmount();

      userMoleculeLifecycle.expectCalledTimesEach(...after);
    });
  });
});

test("Strict mode", () => {
  const expectedUser = "strict@example.com";

  const lifecycle = createLifecycleUtils();
  const UseLifecycleMolecule = molecule(() => {
    const userId = use(UserScope);
    lifecycle.connect(userId);
    return userId;
  });
  const testHook = () => {
    return {
      molecule: useMolecule(UseLifecycleMolecule, {
        exclusiveScope: [UserScope, expectedUser],
      }),
    };
  };

  lifecycle.expectUncalled();

  const run1 = renderHook(testHook, {
    wrapper: StrictMode,
  });

  function expectActiveMounted() {
    // Then execution are called twice
    // Because once for each render in strict mode
    expect(lifecycle.executions).toBeCalledTimes(2);
    // Then mounts are called twice
    // Because of useEffects called twice in strict mode
    expect(lifecycle.mounts).toBeCalledTimes(2);
    // The unount is called once
    // To cleanup from the original useEffect
    expect(lifecycle.unmounts).toBeCalledTimes(1);
  }
  expectActiveMounted();
  expect(run1.result.current.molecule).toBe(expectedUser);

  const run2 = renderHook(testHook, {
    wrapper: StrictMode,
  });

  /**
   * Then nothing has changed in the molecule lifecycle
   * Because a subscription was active at render time
   * And it re-uses the cached value
   */
  expectActiveMounted();
  expect(run2.result.current.molecule).toBe(expectedUser);

  run1.unmount();

  /**
   * Then nothing has changed in the molecule lifecycle
   * Because a subscription is still active
   */
  expectActiveMounted();

  run2.unmount();

  expect(lifecycle.executions).toBeCalledTimes(2);
  expect(lifecycle.mounts).toBeCalledTimes(2);
  // Unmounts are called
  expect(lifecycle.unmounts).toBeCalledTimes(2);
});
