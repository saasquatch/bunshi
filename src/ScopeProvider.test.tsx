import { renderHook } from "@testing-library/react-hooks";
import { atom, useAtom } from "jotai";
import React, { useContext } from "react";
import { createScope, molecule } from "./molecule";
import { ScopeProvider, SCOPE_CONTEXT, useMolecule } from "./ScopeProvider";

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

test("String scope values aren't shared across providers", () => {
  const Wrapper1 = ({ children }: { children?: React.ReactNode }) => (
    <ScopeProvider
      scope={UserScope}
      value={"sam@example.com"}
      children={children}
    />
  );
  const Wrapper2 = ({ children }: { children?: React.ReactNode }) => (
    <ScopeProvider
      scope={UserScope}
      value={"sam@example.com"}
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

  expect(result1.current.molecule).not.toBe(result2.current.molecule);
  expect(result1.current.molecule.userId).toBe("sam@example.com");
  expect(result2.current.molecule.userId).toBe("sam@example.com");
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
