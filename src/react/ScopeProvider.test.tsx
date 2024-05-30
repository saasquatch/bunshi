import { act, render, renderHook } from "@testing-library/react";
import {
  Atom,
  PrimitiveAtom,
  atom,
  getDefaultStore,
  useAtom,
  useAtomValue,
  useSetAtom,
} from "jotai";
import React, { ReactNode, useContext, useEffect } from "react";
import { createLifecycleUtils } from "../shared/testing/lifecycle";
import { createScope, molecule, resetDefaultInjector, use } from "../vanilla";
import { ScopeProvider } from "./ScopeProvider";
import { ScopeContext } from "./contexts/ScopeContext";
import { strictModeSuite } from "./testing/strictModeSuite";
import { useMolecule } from "./useMolecule";

const ExampleMolecule = molecule(() => {
  return {
    example: Math.random(),
  };
});

export const UserScope = createScope("user@example.com");

const AtomScope = createScope(atom("user@example.com"));

const userLifecycle = createLifecycleUtils();
export const UserMolecule = molecule(() => {
  const userId = use(UserScope);

  userLifecycle.connect(userId);
  return {
    example: Math.random(),
    userId,
  };
});

const atomLifecycle = createLifecycleUtils();
const AtomMolecule = molecule(() => {
  const userAtom = use(AtomScope);

  const userNameAtom = atom((get) => get(userAtom) + " name");
  atomLifecycle.connect(userAtom);
  return {
    example: Math.random(),
    userIdAtom: userAtom,
    userNameAtom,
  };
});

strictModeSuite(({ wrapper: Outer, isStrict }) => {
  test("Use molecule should produce a single value across multiple uses", () => {
    const { result: result1 } = renderHook(() => useMolecule(ExampleMolecule), {
      wrapper: Outer,
    });
    const { result: result2 } = renderHook(() => useMolecule(ExampleMolecule), {
      wrapper: Outer,
    });

    expect(result1.current).toBe(result2.current);
  });

  test("Alternating scopes", () => {
    const ScopeA = createScope(undefined);
    const ScopeB = createScope(undefined);
    const ScopeC = createScope(undefined);

    const ScopeAMolecule = molecule(
      (mol, scope) => `${scope(ScopeA)}/${scope(ScopeB)}/${scope(ScopeC)}`,
    );
    const Wrapper = ({ children }: { children?: React.ReactNode }) => (
      <Outer>
        <ScopeProvider scope={ScopeA} value={"a1"}>
          <ScopeProvider scope={ScopeB} value={"b1"}>
            <ScopeProvider scope={ScopeC} value={"c1"}>
              <ScopeProvider scope={ScopeB} value={"b2"}>
                {children}
              </ScopeProvider>
            </ScopeProvider>
          </ScopeProvider>
        </ScopeProvider>
      </Outer>
    );

    const useTestcase = () => {
      return {
        molecule: useMolecule(ScopeAMolecule),
        context: useContext(ScopeContext),
      };
    };
    const { result } = renderHook(useTestcase, {
      wrapper: Wrapper,
    });

    expect(result.current.molecule).toStrictEqual("a1/b2/c1");
  });

  test("Use molecule should produce a different value in different providers", () => {
    const Wrapper1 = ({ children }: { children?: React.ReactNode }) => (
      <Outer>
        <ScopeProvider scope={UserScope} value={"sam@example.com"}>
          {children}
        </ScopeProvider>
      </Outer>
    );
    const Wrapper2 = ({ children }: { children?: React.ReactNode }) => (
      <Outer>
        <ScopeProvider
          scope={UserScope}
          value={"jeffrey@example.com"}
          children={children}
        />
      </Outer>
    );

    const useUserMolecule = () => {
      return {
        molecule: useMolecule(UserMolecule),
        context: useContext(ScopeContext),
      };
    };

    const { result: result1, ...rest1 } = renderHook(useUserMolecule, {
      wrapper: Wrapper1,
    });

    expect(userLifecycle.mounts).toHaveBeenLastCalledWith("sam@example.com");

    const { result: result2, ...rest2 } = renderHook(useUserMolecule, {
      wrapper: Wrapper2,
    });
    expect(userLifecycle.mounts).toHaveBeenLastCalledWith(
      "jeffrey@example.com",
    );

    expect(result1.current.context).toStrictEqual([
      [UserScope, "sam@example.com"],
    ]);
    expect(result1.current.molecule.userId).toBe("sam@example.com");
    expect(result2.current.molecule.userId).toBe("jeffrey@example.com");

    rest1.unmount();
    expect(userLifecycle.unmounts).toHaveBeenLastCalledWith("sam@example.com");

    rest2.unmount();
    expect(userLifecycle.unmounts).toHaveBeenLastCalledWith(
      "jeffrey@example.com",
    );

    if (isStrict) {
      // userLifecycle.expectCalledTimesEach(4, 4, 4);
    } else {
      userLifecycle.expectToHaveBeenCalledTimes(2);
      userLifecycle.expectToMatchCalls(
        ["sam@example.com"],
        ["jeffrey@example.com"],
      );
    }
  });

  describe("Separate ScopeProviders", () => {
    beforeEach(() => {
      // Turn on logging for this test
      resetDefaultInjector({});
    });
    test("String scope values are cleaned up at the right time (not too soon, not too late)", async () => {
      const TestHookContext = React.createContext<
        ReturnType<typeof useTestHook>
      >(undefined as any);

      const mountA = atom(true);
      const valueA = atom(undefined as unknown);
      const mountB = atom(true);
      const valueB = atom(undefined as unknown);

      const useTestHook = () => {
        const setMountA = useSetAtom(mountA);
        const setMountB = useSetAtom(mountB);
        return { setMountA, setMountB };
      };

      const sharedAtExample = "shared@example.com";

      const Child = (props: {
        name: string;
        value: PrimitiveAtom<unknown>;
      }) => {
        const value = useMolecule(UserMolecule);
        const setValue = useSetAtom(props.value);

        // console.log("Child render", props.name, value);
        useEffect(() => {
          // console.log("Child effect", props.name, value);
          setValue(value);
          return () => {
            setValue(undefined);
          };
        }, []);

        setValue(value);
        return <div>Bad</div>;
      };
      const ProviderWithChild = (props: {
        show: Atom<boolean>;
        value: PrimitiveAtom<unknown>;
        name: string;
      }) => {
        const isShown = useAtomValue(props.show);
        return (
          <ScopeProvider scope={UserScope} value={sharedAtExample}>
            {isShown && <Child name={props.name} value={props.value} />}
          </ScopeProvider>
        );
      };

      const Controller = () => {
        return (
          <>
            <ProviderWithChild key="a" name="a" show={mountA} value={valueA} />
            <ProviderWithChild key="b" name="b" show={mountB} value={valueB} />
          </>
        );
      };

      const TestHookProvider: React.FC<{ children: ReactNode }> = ({
        children,
      }) => {
        const props = useTestHook();
        return (
          <Outer>
            <TestHookContext.Provider value={props}>
              {children}
              <Controller />
            </TestHookContext.Provider>
          </Outer>
        );
      };

      userLifecycle.expectUncalled();

      // When the component is initially mounted
      const { result, ...rest } = renderHook(
        () => useContext(TestHookContext),
        {
          wrapper: TestHookProvider,
        },
      );

      const initialValue = getDefaultStore().get(valueA);
      let aValue = getDefaultStore().get(valueA);
      let bValue = getDefaultStore().get(valueB);

      // Then the molecule is mounted
      // and executed twice, since each call to `useMolecule` will call once
      // and mounted once, because only one value will be used
      // and never unmounted
      if (isStrict) {
        userLifecycle.expectCalledTimesEach(2, 2, 1);
      } else {
        userLifecycle.expectCalledTimesEach(2, 1, 0);
      }
      expect(aValue).toBe(bValue);

      act(() => {
        // When A is unmounted
        result.current.setMountA(false);
      });

      // Then the molecule is still mounted
      // Because it's still being used by B
      if (isStrict) {
        userLifecycle.expectCalledTimesEach(2, 2, 1);
      } else {
        userLifecycle.expectCalledTimesEach(2, 1, 0);
      }

      aValue = getDefaultStore().get(valueA);
      bValue = getDefaultStore().get(valueB);

      // Then A has been unmounted
      expect(aValue).toBe(undefined);
      // Then B still has the original value
      expect(bValue).toBe(initialValue);

      // When B is unmounted
      act(() => {
        // When A is unmounted
        result.current.setMountB(false);
      });

      // Then the molecule is unmounted
      if (isStrict) {
        userLifecycle.expectCalledTimesEach(2, 2, 2);
      } else {
        userLifecycle.expectCalledTimesEach(2, 1, 1);
      }

      aValue = getDefaultStore().get(valueA);
      bValue = getDefaultStore().get(valueB);

      // Then both values are cleaned up
      expect(aValue).not.toBe(initialValue);
      expect(bValue).not.toBe(initialValue);
      expect(aValue).toBeUndefined();
      expect(bValue).toBeUndefined();

      // When B is re-mounted
      act(() => {
        result.current.setMountB(true);
      });

      bValue = getDefaultStore().get(valueB);
      // Then a new molecule value is created
      if (isStrict) {
        userLifecycle.expectCalledTimesEach(3, 4, 3);
      } else {
        userLifecycle.expectCalledTimesEach(3, 2, 1);
      }
      expect(bValue).not.toBeUndefined();
      // And it doesn't match the original value
      expect(bValue).not.toBe(initialValue);
      expect(bValue).not.toStrictEqual(initialValue);

      // When the component is unmounted
      rest.unmount();

      // Then the user molecule lifecycle has been completed twice
      if (isStrict) {
        userLifecycle.expectCalledTimesEach(3, 4, 4);
      } else {
        userLifecycle.expectCalledTimesEach(3, 2, 2);
      }
    });
  });

  test("Void scopes can be used to create unique molecules", () => {
    const VoidScope = createScope(undefined);

    const Wrapper1 = ({ children }: { children?: React.ReactNode }) => (
      <Outer>
        <ScopeProvider scope={VoidScope} children={children} uniqueValue />
      </Outer>
    );
    const Wrapper2 = ({ children }: { children?: React.ReactNode }) => (
      <Outer>
        <ScopeProvider scope={VoidScope} children={children} uniqueValue />
      </Outer>
    );

    const voidLifecycle = createLifecycleUtils();
    const voidMolecule = molecule(() => {
      use(VoidScope);
      voidLifecycle.connect();
      return {
        example: Math.random(),
      };
    });
    const useVoidMolecule = () => {
      return {
        molecule: useMolecule(voidMolecule),
        context: useContext(ScopeContext),
      };
    };

    voidLifecycle.expectUncalled();
    const { result: result1, ...rest1 } = renderHook(useVoidMolecule, {
      wrapper: Wrapper1,
    });
    const { result: result2, ...rest2 } = renderHook(useVoidMolecule, {
      wrapper: Wrapper2,
    });

    expect(result1.current.molecule).not.toBe(result2.current.molecule);

    if (isStrict) {
      // Note: Since this is using a default scope, it is better memoized
      voidLifecycle.expectCalledTimesEach(2, 4, 2);
    } else {
      voidLifecycle.expectCalledTimesEach(2, 2, 0);
    }

    rest1.unmount();
    rest2.unmount();

    if (isStrict) {
      // Note: Since this is using a default scope, it is better memoized
      voidLifecycle.expectCalledTimesEach(2, 4, 4);
    } else {
      voidLifecycle.expectToHaveBeenCalledTimes(2);
    }
  });

  test("Object scope values are shared across providers", () => {
    const childAtom = atom("sam@example.com");
    const Wrapper1 = ({ children }: { children?: React.ReactNode }) => (
      <ScopeProvider scope={AtomScope} value={childAtom} children={children} />
    );
    const Wrapper2 = ({ children }: { children?: React.ReactNode }) => (
      <ScopeProvider scope={AtomScope} value={childAtom} children={children} />
    );

    const useUserMolecule = () => {
      const molecule = useMolecule(AtomMolecule);
      const context = useContext(ScopeContext);
      const name = useAtom(molecule.userNameAtom)[0];
      const userId = useAtom(molecule.userIdAtom)[0];
      return {
        molecule,
        context,
        name,
        userId,
      };
    };
    atomLifecycle.expectUncalled();
    const { result: result1, ...rest1 } = renderHook(useUserMolecule, {
      wrapper: Wrapper1,
    });
    atomLifecycle.expectActivelyMounted();
    const { result: result2, ...rest2 } = renderHook(useUserMolecule, {
      wrapper: Wrapper2,
    });
    atomLifecycle.expectActivelyMounted();
    expect(result1.current.molecule).toBe(result2.current.molecule);
    expect(result1.current.userId).toBe("sam@example.com");
    expect(result2.current.userId).toBe("sam@example.com");

    rest1.unmount();
    atomLifecycle.expectActivelyMounted();
    rest2.unmount();

    atomLifecycle.expectToMatchCalls([childAtom]);
  });

  test("Use molecule should will use the nested scope", () => {
    const Wrapper = ({ children }: { children?: React.ReactNode }) => (
      <Outer>
        <ScopeProvider scope={UserScope} value={"sam@example.com"}>
          <ScopeProvider scope={UserScope} value={"jeffrey@example.com"}>
            {children}
          </ScopeProvider>
        </ScopeProvider>
      </Outer>
    );

    userLifecycle.expectUncalled();
    const useUserMolecule = () => {
      return {
        molecule: useMolecule(UserMolecule),
        context: useContext(ScopeContext),
      };
    };
    const { result, ...rest } = renderHook(useUserMolecule, {
      wrapper: Wrapper,
    });

    if (isStrict) {
      userLifecycle.expectCalledTimesEach(1, 2, 1);
    } else {
      userLifecycle.expectCalledTimesEach(1, 1, 0);
    }

    expect(result.current.context).toStrictEqual([
      [UserScope, "jeffrey@example.com"],
    ]);
    expect(result.current.molecule.userId).toBe("jeffrey@example.com");

    rest.unmount();

    if (isStrict) {
      userLifecycle.expectCalledTimesEach(1, 2, 2);
    } else {
      userLifecycle.expectCalledTimesEach(1, 1, 1);
      userLifecycle.expectToMatchCalls(["jeffrey@example.com"]);
    }
  });

  describe("Issue #64 - Peer providers don't share a value", () => {
    const Wrapper = ({ children }: { children?: React.ReactNode }) => (
      <Outer>{children}</Outer>
    );

    const Nested = molecule(() => use(UserMolecule));

    const NestedComponent = () => (
      <div data-testid="nested">{useMolecule(Nested).example}</div>
    );
    const NonNestedComponent = () => (
      <div data-testid="non-nested">{useMolecule(UserMolecule).example}</div>
    );

    test.each([{ tcase: "nested" }, { tcase: "direct" }])(
      "Should render when $tcase is first",
      async ({ tcase }) => {
        userLifecycle.expectUncalled();

        const result = render(
          tcase === "nested" ? (
            <>
              <ScopeProvider scope={UserScope} value="bob">
                <NestedComponent />
              </ScopeProvider>
              <ScopeProvider scope={UserScope} value="bob">
                <NonNestedComponent />
              </ScopeProvider>
            </>
          ) : (
            <>
              <ScopeProvider scope={UserScope} value="bob">
                <NonNestedComponent />
              </ScopeProvider>
              <ScopeProvider scope={UserScope} value="bob">
                <NestedComponent />
              </ScopeProvider>
            </>
          ),
          {
            wrapper: Wrapper,
          },
        );

        // if (isStrict) {
        //   userLifecycle.expectCalledTimesEach(1, 2, 1);
        // } else {
        //   userLifecycle.expectCalledTimesEach(1, 1, 0);
        // }

        const a = await result.findByTestId("nested");
        const b = await result.findByTestId("non-nested");
        expect(a.innerText).toBe(b.innerText);
        result.unmount();

        // if (isStrict) {
        //   userLifecycle.expectCalledTimesEach(1, 2, 2);
        // } else {
        //   userLifecycle.expectCalledTimesEach(1, 1, 1);
        //   userLifecycle.expectToMatchCalls(["bob"]);
        // }
      },
    );
  });
});
