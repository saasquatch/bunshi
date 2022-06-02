import { renderHook } from "@testing-library/react-hooks";
import React, { useContext } from "react";
import { ScopeContext } from "./contexts/ScopeContext";
import { ScopeProvider } from "./ScopeProvider";
import { UserMolecule, UserScope } from "./ScopeProvider.test";
import { useMolecule } from "./useMolecule";

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
  test("Exclusive scope ignores wrappers scope", () => {
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
      result.current.molecule2.userId
    );
  });
});
