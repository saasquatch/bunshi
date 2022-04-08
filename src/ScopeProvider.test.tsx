import { act, renderHook } from "@testing-library/react-hooks";
import { atom, useAtom } from "jotai";
import React, { useContext, useState } from "react";
import { createScope, molecule } from "./molecule";
import {
  ScopeProvider,
  SCOPE_CACHE_CONTEXT,
  SCOPE_CONTEXT,
  useMolecule,
} from "./ScopeProvider";

const ExampleMolecule = molecule(() => {
  return {
    example: Math.random(),
  };
});

const UserScope = createScope("user@example.com");

const AtomScope = createScope(atom("user@example.com"));

const UserMolecule = molecule((_, getScope) => {
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

test("Alternative scopes", () => {
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
      context: useContext(SCOPE_CONTEXT),
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
      context: useContext(SCOPE_CONTEXT),
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
      context: useContext(SCOPE_CONTEXT),
    };
  };

  test("String scope values are cleaned up at the right time (not too soon, not too late)", async () => {
    const Context = React.createContext<ReturnType<typeof useTextHook>>(
      undefined as any
    );
    const useTextHook = () => {
      const [mountA, setMountA] = useState(true);
      const [mountB, setMountB] = useState(true);
      const cache = useContext(SCOPE_CACHE_CONTEXT);

      const props = { cache, mountA, mountB, setMountA, setMountB };
      return props;
    };
    const sharedKey = "shared@example.com";
    const TestStuffProvider: React.FC = ({ children }) => {
      const props = useTextHook();
      return (
        <Context.Provider value={props}>
          {children}
          <Controller {...props} />
        </Context.Provider>
      );
    };
    const Controller = (props: any) => {
      return (
        <>
          {props.mountA && (
            <ScopeProvider scope={UserScope} value={sharedKey}>
              Bad
            </ScopeProvider>
          )}
          {props.mountB && (
            <ScopeProvider scope={UserScope} value={sharedKey}>
              Bad
            </ScopeProvider>
          )}
        </>
      );
    };

    const { result } = renderHook(() => useContext(Context), {
      wrapper: TestStuffProvider,
    });

    const { cache } = result.current;
    const initialScopeCache = cache.get(UserScope)?.get(sharedKey);
    expect(initialScopeCache).not.toBeUndefined();
    expect(initialScopeCache?.tuple).not.toBeUndefined();
    expect(initialScopeCache?.references.size).toBe(2);

    await act(() => {
      result.current.setMountA(false);
    });

    const afterUnmountCache = cache.get(UserScope)?.get(sharedKey);
    expect(afterUnmountCache?.references.size).toBe(1);
    expect(afterUnmountCache?.tuple).toBe(initialScopeCache?.tuple);

    act(() => {
      result.current.setMountB(false);
    });

    const finalTuple = cache.get(UserScope)?.get(sharedKey);
    expect(finalTuple).toBeUndefined();
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
      context: useContext(SCOPE_CONTEXT),
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
    const context = useContext(SCOPE_CONTEXT);
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
      context: useContext(SCOPE_CONTEXT),
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
