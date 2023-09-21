import { renderHook } from "@testing-library/react-hooks";
import React from "react";
import { describe, expect, test } from "vitest";
import { ScopeProvider, createScope, molecule, useMolecule } from "../";

import { ComponentScope, useScopes as useOriginalScopes } from "bunshi/react";
const useScopes = () =>
  useOriginalScopes().filter(([scope]) => scope !== ComponentScope);

export const UserScope = createScope("user@example.com");

export const UserMolecule = molecule((_, getScope) => {
  const userId = getScope(UserScope);

  return {
    example: Math.random(),
    userId,
  };
});

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
        context: useScopes(),
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
