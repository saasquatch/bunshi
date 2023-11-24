import { act, renderHook } from "@testing-library/react";
import { atom, useAtom } from "jotai";
import React, { ReactNode, useContext, useRef, useState } from "react";
import { createLifecycleUtils } from "../shared/testing/lifecycle";
import { ComponentScope, createScope, molecule, use } from "../vanilla";
import { ScopeProvider } from "./ScopeProvider";
import { ScopeContext } from "./contexts/ScopeContext";
import { strictModeSuite } from "./testing/strictModeSuite";
import { useMolecule } from "./useMolecule";
import { useScopes } from "./useScopes";

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

strictModeSuite(({ wrapper: Outer }) => {
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

    userLifecycle.expectToHaveBeenCalledTimes(2);
    userLifecycle.expectToMatchCalls(
      ["sam@example.com"],
      ["jeffrey@example.com"],
    );
  });

  describe("String scopes", () => {
    test("String scope values are cleaned up at the right time (not too soon, not too late)", async () => {
      const StringScopeTestContext = React.createContext<
        ReturnType<typeof useTextHook>
      >(undefined as any);
      const useTextHook = () => {
        const [mountA, setMountA] = useState(true);
        const [mountB, setMountB] = useState(true);
        const insideValue = useRef(null as any);
        const props = { mountA, mountB, setMountA, setMountB, insideValue };
        return props;
      };
      const sharedAtExample = "shared@example.com";
      const TestStuffProvider: React.FC<{ children: ReactNode }> = ({
        children,
      }) => {
        const props = useTextHook();
        return (
          <Outer>
            <StringScopeTestContext.Provider value={props}>
              {children}
              <Controller {...props} />
            </StringScopeTestContext.Provider>
          </Outer>
        );
      };
      const Child = () => {
        const scopes = useScopes().filter(
          ([scope]) => scope !== ComponentScope,
        );
        const context = useContext(StringScopeTestContext);
        useMolecule(UserMolecule);
        context.insideValue.current = scopes;
        return <div>Bad</div>;
      };
      const Controller = (props: any) => {
        return (
          <>
            {props.mountA && (
              <ScopeProvider scope={UserScope} value={sharedAtExample}>
                <Child />
              </ScopeProvider>
            )}
            {props.mountB && (
              <ScopeProvider scope={UserScope} value={sharedAtExample}>
                <Child />
              </ScopeProvider>
            )}
          </>
        );
      };

      userLifecycle.expectUncalled();

      // When the component is initially mounted
      const { result, ...rest } = renderHook(
        () => useContext(StringScopeTestContext),
        {
          wrapper: TestStuffProvider,
        },
      );

      const { insideValue } = result.current;

      // Then the lifecycle events are called
      expect(userLifecycle.mounts).toHaveBeenCalledWith(sharedAtExample);
      // Then the scopes matches the initial value
      expect(insideValue.current).toStrictEqual([[UserScope, sharedAtExample]]);

      const userScopeTuple = insideValue.current[0];

      // When A is unmounted
      act(() => {
        result.current.setMountA(false);
      });

      // Then the molecule is still mounted
      userLifecycle.expectActivelyMounted();

      const afterUnmountCache = insideValue.current;

      // Then the scope tuple is unchanged
      expect(afterUnmountCache[0]).toBe(userScopeTuple);

      // When B is unmounted
      act(() => {
        result.current.setMountB(false);
      });

      // Then the molecule is unmounted
      userLifecycle.expectToMatchCalls([sharedAtExample]);

      // Then the scope tuple is unchanged
      const finalTuples = insideValue.current;
      expect(finalTuples[0]).toBe(userScopeTuple);

      // When B is re-mounted
      act(() => {
        result.current.setMountB(true);
      });

      // Then a fresh tuple is created
      const freshTuples = insideValue.current;
      const [freshTuple] = freshTuples;

      // And it does not match the original
      expect(freshTuple).not.toBe(userScopeTuple);
      if (true) {
        const [scopeKey, scopeValue] = freshTuple;
        expect(scopeKey).toBe(UserScope);
        expect(scopeValue).toBe(sharedAtExample);
      }

      // When the component is unmounted
      rest.unmount();

      // Then the user molecule lifecycle has been completed 2
      userLifecycle.expectToHaveBeenCalledTimes(2);

      // And it has been called with the same value twice, across 2 leases
      userLifecycle.expectToMatchCalls([sharedAtExample], [sharedAtExample]);
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

    rest1.unmount();
    rest2.unmount();

    voidLifecycle.expectToHaveBeenCalledTimes(2);
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
    userLifecycle.expectActivelyMounted();

    expect(result.current.context).toStrictEqual([
      [UserScope, "jeffrey@example.com"],
    ]);
    expect(result.current.molecule.userId).toBe("jeffrey@example.com");

    rest.unmount();

    userLifecycle.expectToMatchCalls(["jeffrey@example.com"]);
  });
});
