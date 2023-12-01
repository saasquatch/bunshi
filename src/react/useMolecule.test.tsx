import { renderHook } from "@testing-library/react";
import React, { StrictMode, useContext } from "react";
import { createScope, molecule, onMount, onUnmount, use } from ".";
import { ScopeProvider } from "./ScopeProvider";
import { ScopeContext } from "./contexts/ScopeContext";
import { strictModeSuite } from "./testing/strictModeSuite";
import { useMolecule } from "./useMolecule";
import { createLifecycleUtils } from "../shared/testing/lifecycle";

export const UserScope = createScope("user@example.com", {
  debugLabel: "User Scope",
});

export const UserMolecule = molecule((_, getScope) => {
  const userId = getScope(UserScope);

  return {
    example: Math.random(),
    userId,
  };
});

strictModeSuite(({ wrapper }) => {
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
      const runs = vi.fn();
      const mounts = vi.fn();
      const unmounts = vi.fn();

      const UseLifecycleMolecule = molecule(() => {
        const userId = use(UserScope);
        onMount(() => {
          mounts(userId);
          return () => {
            unmounts("indirect", userId);
          };
        });

        onUnmount(() => {
          unmounts("direct", userId);
        });

        runs(userId);
        return userId;
      });

      const jeffry = "jeffrey@example.com";
      const useUserMolecule = () => {
        return {
          molecule: useMolecule(UseLifecycleMolecule, {
            withScope: [UserScope, jeffry],
          }),
        };
      };

      beforeEach(() => {
        runs.mockReset();
        mounts.mockReset();
        unmounts.mockReset();
      });

      test("Works with withScope", () => {
        expectUserLifecycle(useUserMolecule, jeffry);
      });

      test("Works with default scope", () => {
        const testHook = () => {
          return {
            molecule: useMolecule(UseLifecycleMolecule),
          };
        };
        expectUserLifecycle(testHook, "user@example.com");
      });

      function expectUserLifecycle(
        testHook: typeof useUserMolecule,
        expectedUser: string,
      ) {
        expect(runs).not.toBeCalled();
        expect(mounts).not.toBeCalled();
        expect(unmounts).not.toBeCalled();

        const run1 = renderHook(testHook, {
          wrapper,
        });

        expect(runs).toBeCalledWith(expectedUser);
        expect(mounts).toBeCalledWith(expectedUser);
        expect(unmounts).not.toBeCalled();

        expect(run1.result.current.molecule).toBe(expectedUser);

        const run2 = renderHook(testHook, {
          wrapper,
        });

        expect(runs).toBeCalledTimes(1);
        expect(mounts).toBeCalledTimes(1);
        expect(unmounts).not.toBeCalled();
        expect(run2.result.current.molecule).toBe(expectedUser);

        run1.unmount();

        expect(runs).toBeCalledTimes(1);
        expect(mounts).toBeCalledTimes(1);
        // Then unmounts aren't called
        expect(unmounts).not.toBeCalled();

        run2.unmount();

        expect(runs).toBeCalledTimes(1);
        expect(mounts).toBeCalledTimes(1);
        // Then both unmounts are called
        expect(unmounts).toBeCalledTimes(2);
        expect(unmounts).toHaveBeenNthCalledWith(1, "direct", expectedUser);
        expect(unmounts).toHaveBeenNthCalledWith(2, "indirect", expectedUser);
      }
    });

    test("Empty", () => {});
  });
});

test.todo("Strict mode", () => {
  const expectedUser = "johan";

  const lifecycle = createLifecycleUtils();
  const UseLifecycleMolecule = molecule(() => {
    const userId = use(UserScope);
    lifecycle.connect(userId);
    return userId;
  });
  const testHook = () => {
    return {
      molecule: useMolecule(UseLifecycleMolecule, {
        // exclusiveScope: [UserScope, expectedUser],
      }),
    };
  };

  lifecycle.expectUncalled();

  const run1 = renderHook(testHook, {
    wrapper: StrictMode,
  });

  expect.soft(lifecycle.executions).toBeCalledWith(expectedUser);
  expect.soft(lifecycle.mounts).toBeCalledWith(expectedUser);
  expect.soft(lifecycle.executions).toBeCalledTimes(2);
  expect.soft(lifecycle.mounts).toBeCalledTimes(2);
  expect.soft(lifecycle.unmounts).toBeCalledTimes(1);
  expect.soft(run1.result.current.molecule).toBe(expectedUser);

  const run2 = renderHook(testHook, {
    wrapper: StrictMode,
  });

  // expect(runs).toBeCalledTimes(2);
  // expect(unmounts).toBeCalledTimes(4);
  // expect(mounts).toBeCalledTimes(1);
  // expect(unmounts).not.toBeCalled();
  // expect(run2.result.current.molecule).toBe(expectedUser);

  run1.unmount();

  expect(lifecycle.executions).toBeCalledWith(expectedUser);
  expect(lifecycle.mounts).toBeCalledWith(expectedUser);
  expect(lifecycle.executions).toBeCalledTimes(3);
  expect(lifecycle.mounts).toBeCalledTimes(2);
  expect(lifecycle.unmounts).toBeCalledTimes(1);
  expect(run1.result.current.molecule).toBe(expectedUser);

  run2.unmount();

  expect(lifecycle.executions).toBeCalledTimes(3);
  expect(lifecycle.mounts).toBeCalledTimes(2);
  // Unmounts are called
  expect(lifecycle.unmounts).toBeCalledTimes(2);
});
