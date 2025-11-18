import { render, renderHook } from "@testing-library/react";
import React, { StrictMode, useContext } from "react";
import {
  createScope,
  molecule,
  moleculeInterface,
  use,
  type Molecule,
  type MoleculeInterface,
  type MoleculeOrInterface,
} from ".";
import {
  createLifecycleUtils,
  type LifecycleUtilsTuple,
} from "../shared/testing/lifecycle";
import { ScopeProvider } from "./ScopeProvider";
import { ScopeContext } from "./contexts/ScopeContext";
import { strictModeSuite } from "./testing/strictModeSuite";
import { useMolecule } from "./useMolecule";
import { atom, useAtomValue, type Atom, type PrimitiveAtom } from "jotai";

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

describe("type safety", () => {
  const exampleMolecule = molecule(() => 42);

  test("molecule returns a Molecule", () => {
    expectTypeOf(exampleMolecule).toEqualTypeOf<Molecule<number>>();
  });

  test("molecule should infer the correct type of molecule", () => {
    expectTypeOf(molecule(() => 42)).toEqualTypeOf<Molecule<number>>();
    expectTypeOf(molecule(() => "hi")).toEqualTypeOf<Molecule<string>>();
    expectTypeOf(molecule(() => ({ a: 1, b: "two" as const }))).toEqualTypeOf<
      Molecule<{ a: number; b: "two" }>
    >();
  });

  test("useMolecule should infer the correct return type of molecule", () => {
    expectTypeOf(() =>
      useMolecule(exampleMolecule),
    ).returns.toEqualTypeOf<number>();
  });

  test("useMolecule should infer the correct generic return type of molecule", () => {
    function useMoleculeGeneric<T>(molecule: Molecule<T>) {
      const value = useMolecule(molecule);
      expectTypeOf({ value }).toEqualTypeOf<{ value: T }>();
      return value;
    }

    expectTypeOf(() =>
      useMoleculeGeneric({} as any),
    ).returns.toEqualTypeOf<unknown>();

    expectTypeOf(() =>
      useMoleculeGeneric(molecule(() => 2)),
    ).returns.toEqualTypeOf<number>();

    expectTypeOf(() =>
      useMoleculeGeneric(molecule(() => ({ a: 1, b: "two" as const }))),
    ).returns.toEqualTypeOf<{ a: number; b: "two" }>();
  });

  describe("with jotai", () => {
    const exampleAtomMolecule = molecule<Atom<string>>(() => atom("example"));

    test("molecule getter should infer the correct type of molecule", () => {
      const DerivedMolecule = molecule((mol) => {
        const anAtom = mol(exampleAtomMolecule);
        expectTypeOf(anAtom).toEqualTypeOf<Atom<string>>();
        return atom((get) => {
          expectTypeOf(get(anAtom)).toEqualTypeOf<string>();
        });
      });
      expectTypeOf(DerivedMolecule).toEqualTypeOf<Molecule<Atom<void>>>();
    });

    test("useMolecule should infer the correct return type of molecule", () => {
      expectTypeOf(() =>
        useMolecule(exampleAtomMolecule),
      ).returns.toEqualTypeOf<Atom<string>>();
    });

    test("useMolecule with molecule can be used with useAtomValue directly", () => {
      expectTypeOf(() =>
        useAtomValue(useMolecule(exampleAtomMolecule)),
      ).returns.toEqualTypeOf<string>();
    });

    // https://github.com/saasquatch/bunshi/issues/75
    test("useMolecule should infer the correct generic return type of molecule", () => {
      function useMoleculeGeneric<T extends Atom<unknown>>(
        molecule: Molecule<T>,
      ) {
        const atom = useMolecule(molecule);
        expectTypeOf({ atom }).toEqualTypeOf<{ atom: T }>();

        const value1 = useAtomValue(atom);
        expectTypeOf({ value1 }).toEqualTypeOf<{ value1: unknown }>();

        const value2 = useAtomValue(useMolecule(molecule));
        expectTypeOf({ value2 }).toEqualTypeOf<{ value2: unknown }>();
        return { atom, value1, value2 };
      }

      expectTypeOf(() => useMoleculeGeneric({} as any)).returns.toEqualTypeOf<{
        atom: Atom<unknown>;
        value1: unknown; // T extends Atom<unknown> so unknown
        value2: unknown; // T extends Atom<unknown> so unknown
      }>();

      expectTypeOf(() =>
        useMoleculeGeneric(molecule((): Atom<number> => atom(2))),
      ).returns.toEqualTypeOf<{
        atom: Atom<number>;
        value1: unknown; // T extends Atom<unknown> so unknown
        value2: unknown; // T extends Atom<unknown> so unknown
      }>();

      function useMoleculeGenericWithValue<T extends Atom<string>>(
        molecule: Molecule<T>,
      ) {
        const atom = useMolecule(molecule);
        expectTypeOf({ atom }).toEqualTypeOf<{ atom: T }>();

        const value1 = useAtomValue(atom);
        expectTypeOf({ value1 }).toEqualTypeOf<{ value1: string }>();

        const value2 = useAtomValue(useMolecule(molecule));
        expectTypeOf({ value2 }).toEqualTypeOf<{ value2: string }>();

        return { atom, value1, value2 };
      }

      expectTypeOf(() =>
        useMoleculeGenericWithValue({} as any),
      ).returns.toEqualTypeOf<{
        atom: Atom<string>;
        value1: string; // T extends Atom<string> so string
        value2: string; // T extends Atom<string> so string
      }>();

      expectTypeOf(() =>
        useMoleculeGenericWithValue(
          molecule((): PrimitiveAtom<string> => atom("test")),
        ),
      ).returns.toEqualTypeOf<{
        atom: PrimitiveAtom<string>;
        value1: string;
        value2: string;
      }>();

      function useMoleculeGenericWithInferredValue<T extends Atom<any>>(
        molecule: Molecule<T>,
      ): T extends Atom<infer U> ? U : never {
        return useAtomValue(useMolecule(molecule));
      }
      expectTypeOf(() =>
        useMoleculeGenericWithInferredValue({} as any),
      ).returns.toBeAny();
      expectTypeOf(() =>
        useMoleculeGenericWithInferredValue(molecule(() => atom("test"))),
      ).returns.toEqualTypeOf<string>();
    });
  });

  describe("with moleculeInterface", () => {
    const exampleMoleculeInterface = moleculeInterface<number>();

    test("moleculeInterface returns a MoleculeInterface", () => {
      expectTypeOf(exampleMoleculeInterface).toEqualTypeOf<
        MoleculeInterface<number>
      >();
    });

    test("useMolecule should infer the correct return type of moleculeInterface", () => {
      expectTypeOf(() =>
        useMolecule(exampleMoleculeInterface),
      ).returns.toEqualTypeOf<number>();
    });

    test("useMolecule should infer the correct generic return type of moleculeInterface", () => {
      function useMoleculeGeneric<T>(molecule: MoleculeInterface<T>) {
        const value = useMolecule(molecule);
        expectTypeOf({ value }).toEqualTypeOf<{ value: T }>();
        return value;
      }

      expectTypeOf(() =>
        useMoleculeGeneric({} as any),
      ).returns.toEqualTypeOf<unknown>();

      expectTypeOf(() =>
        useMoleculeGeneric(molecule(() => 2)),
      ).returns.toEqualTypeOf<number>();

      expectTypeOf(() =>
        useMoleculeGeneric(molecule(() => ({ a: 1, b: "two" as const }))),
      ).returns.toEqualTypeOf<{ a: number; b: "two" }>();
    });

    test('useMolecule should infer the correct generic return type of "MoleculeOrInterface"', () => {
      function useMoleculeGeneric<T>(molecule: MoleculeOrInterface<T>) {
        const value = useMolecule(molecule);
        expectTypeOf({ value }).toEqualTypeOf<{ value: T }>();
        return value;
      }

      expectTypeOf(() =>
        useMoleculeGeneric({} as any),
      ).returns.toEqualTypeOf<unknown>();

      expectTypeOf(() =>
        useMoleculeGeneric(molecule(() => 2)),
      ).returns.toEqualTypeOf<number>();

      expectTypeOf(() =>
        useMoleculeGeneric(molecule(() => ({ a: 1, b: "two" as const }))),
      ).returns.toEqualTypeOf<{ a: number; b: "two" }>();
    });
  });
});

strictModeSuite(({ wrapper, isStrict }) => {
  describe("useMolecule", () => {
    test("useMolecule returns a function returned by a molecule", () => {
      const returnFunction = () => {};
      const FunctionMolecule = molecule(() => {
        return returnFunction;
      });
      const useFunctionMolecule = () => {
        return {
          molecule: useMolecule(FunctionMolecule),
        };
      };
      const { result } = renderHook(useFunctionMolecule, {});

      expect(result.current.molecule).toBe(returnFunction);
    });

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

    test("global molecule should reset state upon unmount", () => {
      const moleculeLifecycle = createLifecycleUtils();

      let instanceCount = 0;
      const Molecule = molecule(() => {
        const value = `inner-${++instanceCount}`;
        moleculeLifecycle.connect(value);
        return value;
      });

      const Component = () => {
        const value = useMolecule(Molecule);
        return <div>{value}</div>;
      };

      const TestComponent = ({ show }: { show: boolean }) => (
        <>{show && <Component />}</>
      );

      const { rerender } = render(<TestComponent show={true} />);

      // Should be mounted initially
      moleculeLifecycle.expectActivelyMounted();
      expect(instanceCount).toBe(1);

      // Hide the component
      rerender(<TestComponent show={false} />);

      // Should be unmounted
      expect(instanceCount).toBe(1);
      expect(moleculeLifecycle.unmounts).toHaveBeenCalledOnce();
      moleculeLifecycle.expectCalledTimesEach(1, 1, 1);

      // Show the component again
      rerender(<TestComponent show={true} />);

      // Should be remounted, so instance count should increase
      expect(instanceCount).toBe(2);
      moleculeLifecycle.expectCalledTimesEach(2, 2, 1);
    });

    test("global molecule should reset state upon unmount even if another molecule is using the global scope", () => {
      // See https://github.com/saasquatch/bunshi/issues/80

      const outerMoleculeLifecycle = createLifecycleUtils();
      const innerMoleculeLifecycle = createLifecycleUtils();

      let outerInstanceCount = 0;
      const OuterMolecule = molecule(() => {
        const value = `outer-${++outerInstanceCount}`;
        outerMoleculeLifecycle.connect(value);
        return value;
      });

      let innerInstanceCount = 0;
      const InnerMolecule = molecule(() => {
        const value = `inner-${++innerInstanceCount}`;
        innerMoleculeLifecycle.connect(value);
        return value;
      });

      const OuterComponent = ({ children }: { children?: React.ReactNode }) => {
        const outerValue = useMolecule(OuterMolecule);
        return (
          <div>
            <span>Outer: {outerValue}</span>
            {children}
          </div>
        );
      };

      const InnerComponent = () => {
        const innerValue = useMolecule(InnerMolecule);
        return <div>Inner: {innerValue}</div>;
      };

      const TestComponent = ({ showInner }: { showInner: boolean }) => (
        <OuterComponent>{showInner && <InnerComponent />}</OuterComponent>
      );

      const { rerender } = render(<TestComponent showInner={true} />);

      // Both molecules should be mounted initially
      outerMoleculeLifecycle.expectActivelyMounted();
      innerMoleculeLifecycle.expectActivelyMounted();
      expect(outerInstanceCount).toBe(1);
      expect(innerInstanceCount).toBe(1);

      // Hide the inner component
      rerender(<TestComponent showInner={false} />);

      // Outer molecule should still be mounted
      outerMoleculeLifecycle.expectActivelyMounted();
      expect(outerInstanceCount).toBe(1);

      // Inner molecule should be unmounted
      expect(innerInstanceCount).toBe(1);
      expect(innerMoleculeLifecycle.unmounts).toHaveBeenCalledOnce();
      innerMoleculeLifecycle.expectCalledTimesEach(1, 1, 1);

      // Show the inner component again
      rerender(<TestComponent showInner={true} />);

      // Outer molecule should still be mounted
      outerMoleculeLifecycle.expectActivelyMounted();
      expect(outerInstanceCount).toBe(1);

      // Inner molecule should be remounted, so instance count should increase
      expect(innerInstanceCount).toBe(2);
      innerMoleculeLifecycle.expectCalledTimesEach(2, 2, 1);
    });
  });
});

strictModeSuite(({ wrapper, isStrict }) => {
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

    test("Duplicate calls in the same component, with separate scopes", () => {
      const jeffrey = "jeffrey@example.com";
      const useUserMolecule = () => {
        return {
          first: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
          second: useMolecule(UserMolecule, {
            withScope: [UserScope, jeffrey],
          }),
        };
      };

      let before: LifecycleUtilsTuple;
      let after: LifecycleUtilsTuple;
      if (isStrict) {
        before = [4, 2, 1];
        after = [4, 2, 2];
      } else {
        before = [2, 1, 0];
        after = [2, 1, 1];
      }

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

    test("Triplicate calls in the same component, with separate scopes", () => {
      const jeffrey = "jeffrey@example.com";
      const useUserMolecule = () => {
        return {
          first: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
          second: useMolecule(UserMolecule, {
            withScope: [UserScope, jeffrey],
          }),
          third: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
        };
      };

      let before: LifecycleUtilsTuple;
      let after: LifecycleUtilsTuple;
      if (isStrict) {
        before = [6, 2, 1];
        after = [6, 2, 2];
      } else {
        before = [3, 1, 0];
        after = [3, 1, 1];
      }

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

    test("Quadruplicate calls in the same component, with separate scopes", () => {
      const jeffrey = "jeffrey@example.com";
      const useUserMolecule = () => {
        renders();
        return {
          first: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
          second: useMolecule(UserMolecule, {
            withScope: [UserScope, jeffrey],
          }),
          third: useMolecule(UserMolecule, { withScope: [UserScope, jeffrey] }),
          fourth: useMolecule(UserMolecule, {
            withScope: [UserScope, jeffrey],
          }),
        };
      };

      let before: LifecycleUtilsTuple;
      let after: LifecycleUtilsTuple;
      let beforeRenders: number;
      let afterRenders: number;
      if (isStrict) {
        before = [8, 2, 1];
        after = [8, 2, 2];
        beforeRenders = 4;
        afterRenders = 4 + 2;
      } else {
        before = [4, 1, 0];
        after = [4, 1, 1];
        beforeRenders = 2;
        afterRenders = 2 + 1;
      }

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

    test("Duplicate calls in the same component", () => {
      const useUserMolecule = () => {
        renders();
        return {
          first: useMolecule(UserMolecule),
          second: useMolecule(UserMolecule),
        };
      };

      let before: LifecycleUtilsTuple;
      let after: LifecycleUtilsTuple;
      let beforeRenders: number;
      let afterRenders: number;
      if (isStrict) {
        before = [1, 2, 1];
        after = [1, 2, 2];
        beforeRenders = 2;
        afterRenders = 4;
      } else {
        before = [1, 1, 0];
        after = [1, 1, 1];
        beforeRenders = 1;
        afterRenders = 2;
      }

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

    test("Triplicate calls in the same component", () => {
      const useUserMolecule = () => {
        return {
          first: useMolecule(UserMolecule),
          second: useMolecule(UserMolecule),
          third: useMolecule(UserMolecule),
        };
      };

      let before: LifecycleUtilsTuple;
      let after: LifecycleUtilsTuple;
      if (isStrict) {
        before = [1, 2, 1];
        after = [1, 2, 2];
      } else {
        before = [1, 1, 0];
        after = [1, 1, 1];
      }

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

    test("Quadruplicate calls in the same component", () => {
      const useUserMolecule = () => {
        return {
          first: useMolecule(UserMolecule),
          second: useMolecule(UserMolecule),
          third: useMolecule(UserMolecule),
          fourth: useMolecule(UserMolecule),
        };
      };

      let before: LifecycleUtilsTuple;
      let after: LifecycleUtilsTuple;
      if (isStrict) {
        before = [1, 2, 1];
        after = [1, 2, 2];
      } else {
        before = [1, 1, 0];
        after = [1, 1, 1];
      }

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

strictModeSuite(({ wrapper, isStrict }) => {
  test("Strict mode behavior", () => {
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
      wrapper,
    });

    function expectActiveMounted() {
      if (isStrict) {
        // Then execution are called twice
        // Because once for each render in strict mode
        expect(lifecycle.executions).toBeCalledTimes(2);
        // Then mounts are called twice
        // Because of useEffects called twice in strict mode
        expect(lifecycle.mounts).toBeCalledTimes(2);
        // The unount is called once
        // To cleanup from the original useEffect
        expect(lifecycle.unmounts).toBeCalledTimes(1);
      } else {
        expect(lifecycle.executions).toBeCalledTimes(1);
        expect(lifecycle.mounts).toBeCalledTimes(1);
        expect(lifecycle.unmounts).toBeCalledTimes(0);
      }
    }
    expectActiveMounted();
    expect(run1.result.current.molecule).toBe(expectedUser);

    const run2 = renderHook(testHook, {
      wrapper,
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

    if (isStrict) {
      expect(lifecycle.executions).toBeCalledTimes(2);
      expect(lifecycle.mounts).toBeCalledTimes(2);
      // Unmounts are called
      expect(lifecycle.unmounts).toBeCalledTimes(2);
    } else {
      expect(lifecycle.executions).toBeCalledTimes(1);
      expect(lifecycle.mounts).toBeCalledTimes(1);
      expect(lifecycle.unmounts).toBeCalledTimes(1);
    }
  });
});

strictModeSuite(({ wrapper }) => {
  describe("Issue #82 - Implicit and explicit scoped molecule instantiations", () => {
    // NOTE: This issue was reported with React 18 strict mode behavior
    // where components mount -> unmount -> remount, causing cache cleanup issues.
    // React 19 changed strict mode behavior (useMemo is called twice but keeps first result)
    // which has partially resolved this issue. These tests verify the expected behavior.

    // Shared test setup for Issue #82 tests
    const TestScope = createScope("test-id");

    function createTestMolecules() {
      // Source molecule with unique random value
      const sourceLifecycle = createLifecycleUtils();
      let sourceInstanceCount = 0;

      const SourceMolecule = molecule(() => {
        sourceInstanceCount++;
        const value = {
          count: Math.random(),
          id: sourceInstanceCount,
          value: `source-${sourceInstanceCount}`,
        };
        sourceLifecycle.connect(value);
        return value;
      });

      // Other molecule that depends on Source
      const otherLifecycle = createLifecycleUtils();
      const OtherMolecule = molecule(() => {
        const source = use(SourceMolecule);
        const value = { source, other: Math.random() };
        otherLifecycle.connect(value);
        return value;
      });

      return {
        SourceMolecule,
        OtherMolecule,
        sourceLifecycle,
        otherLifecycle,
        getSourceInstanceCount: () => sourceInstanceCount,
      };
    }

    const StrictWrapper = wrapper;

    function createTestWrapper() {
      return ({ children }: { children?: React.ReactNode }) => (
        <StrictWrapper>
          <ScopeProvider scope={TestScope} value="foo">
            {children}
          </ScopeProvider>
        </StrictWrapper>
      );
    }

    describe.each([
      { first: "explicit", second: "implicit" },
      { first: "implicit", second: "explicit" },
    ])("When molecule is first $first then $second", ({ first }) => {
      test("Should share the same instance", () => {
        const {
          SourceMolecule,
          OtherMolecule,
          sourceLifecycle,
          otherLifecycle,
        } = createTestMolecules();
        const Wrapper = createTestWrapper();

        sourceLifecycle.expectUncalled();
        otherLifecycle.expectUncalled();

        let explicitSource: { count: number };
        let implicitSource: { count: number };
        let sourceCountAfterFirst: number;

        if (first === "explicit") {
          // Step 1: Mount Source molecule EXPLICITLY first
          const { result: sourceResult } = renderHook(
            () => useMolecule(SourceMolecule),
            { wrapper: Wrapper },
          );

          explicitSource = sourceResult.current;
          sourceCountAfterFirst = sourceLifecycle.executions.mock.calls.length;

          // Step 2: Mount Other molecule which implicitly uses Source
          const { result: otherResult } = renderHook(
            () => useMolecule(OtherMolecule),
            { wrapper: Wrapper },
          );

          implicitSource = otherResult.current.source;
        } else {
          // Step 1: Mount Other molecule (which implicitly creates Source)
          const { result: otherResult } = renderHook(
            () => useMolecule(OtherMolecule),
            { wrapper: Wrapper },
          );

          implicitSource = otherResult.current.source;
          sourceCountAfterFirst = sourceLifecycle.executions.mock.calls.length;

          // Step 2: Now explicitly mount Source molecule in the same scope
          const { result: sourceResult } = renderHook(
            () => useMolecule(SourceMolecule),
            { wrapper: Wrapper },
          );

          explicitSource = sourceResult.current;
        }

        // CRITICAL: The explicit and implicit instances should be THE SAME
        expect(explicitSource).toBe(implicitSource);
        expect(explicitSource.count).toBe(implicitSource.count);

        // Source should NOT be executed again (already exists in cache)
        expect(sourceLifecycle.executions.mock.calls.length).toBe(
          sourceCountAfterFirst,
        );
      });

      test("Should propagate changes between instances", () => {
        const { SourceMolecule, OtherMolecule } = createTestMolecules();
        const Wrapper = createTestWrapper();

        let sourceValue: { count: number };
        let otherValue: { source: { count: number }; other: number };

        if (first === "explicit") {
          // Mount Source first (explicit)
          const { result: sourceResult } = renderHook(
            () => useMolecule(SourceMolecule),
            { wrapper: Wrapper },
          );
          sourceValue = sourceResult.current;

          // Mount Other second (implicit Source)
          const { result: otherResult } = renderHook(
            () => useMolecule(OtherMolecule),
            { wrapper: Wrapper },
          );
          otherValue = otherResult.current;
        } else {
          // Mount Other first (implicit Source)
          const { result: otherResult } = renderHook(
            () => useMolecule(OtherMolecule),
            { wrapper: Wrapper },
          );
          otherValue = otherResult.current;

          // Mount Source second (explicit)
          const { result: sourceResult } = renderHook(
            () => useMolecule(SourceMolecule),
            { wrapper: Wrapper },
          );
          sourceValue = sourceResult.current;
        }

        // They should be the same instance
        expect(sourceValue).toBe(otherValue.source);

        // Modify via explicit reference
        sourceValue.count = 42;

        // Changes should be visible in implicit reference
        expect(otherValue.source.count).toBe(42);
      });

      test("Should handle toggle pattern with real components", () => {
        const { SourceMolecule, OtherMolecule, getSourceInstanceCount } =
          createTestMolecules();

        // Component that explicitly uses Source
        function ComponentA() {
          const source = useMolecule(SourceMolecule);
          return <div data-testid="component-a">{source.value}</div>;
        }

        // Component that uses Other (which implicitly uses Source)
        function ComponentB() {
          const other = useMolecule(OtherMolecule);
          return <div data-testid="component-b">{other.source.value}</div>;
        }

        let initialValue: string;
        let instancesAfterFirst: number;
        let aValue: string;
        let bValue: string;

        if (first === "explicit") {
          // Main component with toggle - ComponentA (explicit) first
          const TestComponent = ({ showB }: { showB: boolean }) => (
            <ScopeProvider scope={TestScope} value="test">
              <ComponentA />
              {showB && <ComponentB />}
            </ScopeProvider>
          );

          const { rerender, getByTestId } = render(
            <TestComponent showB={false} />,
            { wrapper },
          );

          // Initially, only ComponentA is mounted (explicit Source)
          initialValue = getByTestId("component-a").textContent;
          instancesAfterFirst = getSourceInstanceCount();

          // Now toggle on ComponentB (implicit Source via Other)
          rerender(<TestComponent showB={true} />);

          aValue = getByTestId("component-a").textContent;
          bValue = getByTestId("component-b").textContent;
        } else {
          // Main component with toggle - ComponentB (implicit) first
          const TestComponent = ({ showA }: { showA: boolean }) => (
            <ScopeProvider scope={TestScope} value="test">
              <ComponentB />
              {showA && <ComponentA />}
            </ScopeProvider>
          );

          const { rerender, getByTestId } = render(
            <TestComponent showA={false} />,
            { wrapper },
          );

          // Initially, only ComponentB is mounted (implicit Source)
          initialValue = getByTestId("component-b").textContent;
          instancesAfterFirst = getSourceInstanceCount();

          // Now toggle on ComponentA (explicit Source)
          rerender(<TestComponent showA={true} />);

          bValue = getByTestId("component-b").textContent;
          aValue = getByTestId("component-a").textContent;
        }

        // CRITICAL TEST: Both components should show the SAME source value
        // This is the bug from issue #82 - they were getting different instances
        expect(aValue).toBe(bValue);
        expect(aValue).toBe(initialValue);

        // Source should NOT be created again when second component mounts
        // (it should reuse the instance from first component)
        expect(getSourceInstanceCount()).toBe(instancesAfterFirst);

        // Both components should reference the same instance ID
        expect(aValue).toContain("source-1");
        expect(bValue).toContain("source-1");
      });
    });
  });
});
