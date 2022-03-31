import { renderHook } from "@testing-library/react-hooks";
import React, { useContext } from "react";
import { createScope, molecule } from "./molecule";
import { ScopeProvider, SCOPE_CONTEXT, useMolecule } from "./ScopeProvider";

const ExampleMolecule = molecule(() => {
  return {
    example: Math.random(),
  };
});

const UserScope = createScope("user@example.com");

const UserMolecule = molecule((_, getScope) => {
  const userId = getScope(UserScope);

  return {
    example: Math.random(),
    userId,
  };
});

test("Use molecule should produce a single value across multiple uses", () => {
  const { result: result1 } = renderHook(() => useMolecule(ExampleMolecule));
  const { result: result2 } = renderHook(() => useMolecule(ExampleMolecule));

  expect(result1.current).toBe(result2.current);
});

test("Use molecule should produce a single value across multiple uses", () => {
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
