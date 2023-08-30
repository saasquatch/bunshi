import { act, renderHook } from "@testing-library/react-hooks";
import { atom, useAtom } from "jotai";
import React, { useContext, useRef, useState } from "react";
import { createScope, molecule } from "../vanilla";
import { ScopeProvider } from "./ScopeProvider";
import { ScopeContext } from "./contexts/ScopeContext";
import { useMolecule } from "./useMolecule";
import { useScopes } from "./useScopes";

const ExampleMolecule = molecule(() => {
  return {
    example: Math.random(),
  };
});

export const UserScope = createScope("user@example.com");

const AtomScope = createScope(atom("user@example.com"));

export const UserMolecule = molecule((_, getScope) => {
  const userId = getScope(UserScope);

  return {
    example: Math.random(),
    userId,
  };
});

const AtomMolecule = molecule((_, getScope) => {
  const userAtom = getScope(AtomScope);

  const userNameAtom = atom((get) => get(userAtom) + " name");
  return {
    example: Math.random(),
    userIdAtom: userAtom,
    userNameAtom,
  };
});

test("Use molecule should produce a single value across multiple uses", () => {
  const { result: result1 } = renderHook(() => useMolecule(ExampleMolecule));
  const { result: result2 } = renderHook(() => useMolecule(ExampleMolecule));

  expect(result1.current).toBe(result2.current);
});

test("Alternating scopes", () => {
  const ScopeA = createScope(undefined);
  const ScopeB = createScope(undefined);
  const ScopeC = createScope(undefined);

  const ScopeAMolecule = molecule(
    (getMol, getScope) =>
      `${getScope(ScopeA)}/${getScope(ScopeB)}/${getScope(ScopeC)}`
  );
  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <ScopeProvider scope={ScopeA} value={"a1"}>
      <ScopeProvider scope={ScopeB} value={"b1"}>
        <ScopeProvider scope={ScopeC} value={"c1"}>
          <ScopeProvider scope={ScopeB} value={"b2"}>
            {children}
          </ScopeProvider>
        </ScopeProvider>
      </ScopeProvider>
    </ScopeProvider>
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
    <ScopeProvider scope={UserScope} value={"sam@example.com"}>
      {children}
    </ScopeProvider>
  );
  const Wrapper2 = ({ children }: { children?: React.ReactNode }) => (
    <ScopeProvider
      scope={UserScope}
      value={"jeffrey@example.com"}
      children={children}
    />
  );

  const useUserMolecule = () => {
    return {
      molecule: useMolecule(UserMolecule),
      context: useContext(ScopeContext),
    };
  };
  const { result: result1 } = renderHook(useUserMolecule, {
    wrapper: Wrapper1,
  });
  const { result: result2 } = renderHook(useUserMolecule, {
    wrapper: Wrapper2,
  });

  expect(result1.current.context).toStrictEqual([
    [UserScope, "sam@example.com"],
  ]);
  expect(result1.current.molecule.userId).toBe("sam@example.com");
  expect(result2.current.molecule.userId).toBe("jeffrey@example.com");
});

describe("String scopes", () => {
  const useUserMolecule = () => {
    return {
      molecule: useMolecule(UserMolecule),
      context: useContext(ScopeContext),
    };
  };

  test("String scope values are cleaned up at the right time (not too soon, not too late)", async () => {
    const StringScopeTestContext = React.createContext<ReturnType<typeof useTextHook>>(
      undefined as any
    );
    const useTextHook = () => {
      const [mountA, setMountA] = useState(true);
      const [mountB, setMountB] = useState(true);
      const insideValue = useRef(null as any);
      const props = { mountA, mountB, setMountA, setMountB, insideValue };
      return props;
    };
    const sharedKey = "shared@example.com";
    const TestStuffProvider: React.FC = ({ children }) => {
      const props = useTextHook();
      return (
        <StringScopeTestContext.Provider value={props}>
          {children}
          <Controller {...props} />
        </StringScopeTestContext.Provider>
      );
    };
    const Child = () => {
      const scopes = useScopes();
      const context = useContext(StringScopeTestContext);
      context.insideValue.current = scopes;
      return <div>Bad</div>
    }
    const Controller = (props: any) => {
      return (
        <>
          {props.mountA && (
            <ScopeProvider scope={UserScope} value={sharedKey}>
              <Child />
            </ScopeProvider>
          )}
          {props.mountB && (
            <ScopeProvider scope={UserScope} value={sharedKey}>
              <Child />
            </ScopeProvider>
          )}
        </>
      );
    };

    const { result } = renderHook(() => useContext(StringScopeTestContext), {
      wrapper: TestStuffProvider,
    });

    const { insideValue } = result.current;
    const initialScopes = insideValue.current;
    expect(initialScopes).not.toBeUndefined();
    expect(initialScopes.length).toBe(1);

    const userScopeTuple = initialScopes[0];
    if (true) {
      const [scopeKey, scopeValue] = userScopeTuple;
      expect(scopeKey).toBe(UserScope);
      expect(scopeValue).toBe(sharedKey);
    }

    await act(() => {
      result.current.setMountA(false);
    });

    const afterUnmountCache = insideValue.current;

    expect(afterUnmountCache[0]).toBe(userScopeTuple);

    act(() => {
      result.current.setMountB(false);
    });

    const finalTuples = insideValue.current;
    expect(finalTuples[0]).toBe(userScopeTuple);


    act(() => {
      result.current.setMountB(true);
    });

    const freshTuples = insideValue.current;
    const [freshTuple] = freshTuples;
    expect(freshTuple).not.toBe(userScopeTuple);
    if (true) {
      const [scopeKey, scopeValue] = freshTuple;
      expect(scopeKey).toBe(UserScope);
      expect(scopeValue).toBe(sharedKey);
    }

  });
});

test("Void scopes can be used to create unique molecules", () => {
  const VoidScope = createScope();

  const Wrapper1 = ({ children }: { children?: React.ReactNode }) => (
    <ScopeProvider scope={VoidScope} children={children} uniqueValue />
  );
  const Wrapper2 = ({ children }: { children?: React.ReactNode }) => (
    <ScopeProvider scope={VoidScope} children={children} uniqueValue />
  );

  const voidMolecule = molecule((getMol, getScope) => {
    getScope(VoidScope);
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
  const { result: result1 } = renderHook(useVoidMolecule, {
    wrapper: Wrapper1,
  });
  const { result: result2 } = renderHook(useVoidMolecule, {
    wrapper: Wrapper2,
  });

  expect(result1.current.molecule).not.toBe(result2.current.molecule);
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
  const { result: result1 } = renderHook(useUserMolecule, {
    wrapper: Wrapper1,
  });
  const { result: result2 } = renderHook(useUserMolecule, {
    wrapper: Wrapper2,
  });

  expect(result1.current.molecule).toBe(result2.current.molecule);
  expect(result1.current.userId).toBe("sam@example.com");
  expect(result2.current.userId).toBe("sam@example.com");
});

test("Use molecule should will use the nested scope", () => {
  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <ScopeProvider scope={UserScope} value={"sam@example.com"}>
      <ScopeProvider scope={UserScope} value={"jeffrey@example.com"}>
        {children}
      </ScopeProvider>
    </ScopeProvider>
  );

  const useUserMolecule = () => {
    return {
      molecule: useMolecule(UserMolecule),
      context: useContext(ScopeContext),
    };
  };
  const { result } = renderHook(useUserMolecule, {
    wrapper: Wrapper,
  });

  expect(result.current.context).toStrictEqual([
    [UserScope, "jeffrey@example.com"],
  ]);
  expect(result.current.molecule.userId).toBe("jeffrey@example.com");
});
