import { atom } from "jotai";
import { createInjector, type MoleculeInjector } from "./injector";
import {
  ErrorBadUse,
  ErrorInvalidMolecule,
  ErrorInvalidScope,
  ErrorUnboundMolecule,
} from "./internal/errors";
import { GlobalScopeSymbol } from "./internal/symbols";
import { onMount, onUnmount, use } from "./lifecycle";
import { Molecule, molecule, moleculeInterface } from "./molecule";
import { createScope } from "./scope";
import {
  CompanyScope,
  UserScope,
  company1Scope,
  company2Scope,
  companyMolecule,
  exampleMol,
  unrelatedScope1,
  user1Scope,
  user2Scope,
  userMolecule,
  type BaseAtoms,
} from "./testing/test-molecules";
import { ScopeTuple } from "./types";
import type { MoleculeInternal } from "./internal/internal-types";

describe("type safety", () => {
  const injector = createInjector();

  test("createInjector returns a MoleculeInjector", () => {
    expectTypeOf(createInjector()).toEqualTypeOf<MoleculeInjector>();
  });

  test("injector infer type from molecule", () => {
    expectTypeOf(exampleMol).toEqualTypeOf<Molecule<BaseAtoms>>();

    expectTypeOf(() =>
      injector.get(exampleMol),
    ).returns.toEqualTypeOf<BaseAtoms>();

    expectTypeOf(() => injector.use(exampleMol)).returns.toEqualTypeOf<
      [BaseAtoms, () => unknown]
    >();

    expectTypeOf(() => injector.useLazily(exampleMol)).returns.toEqualTypeOf<
      [BaseAtoms, { start: () => BaseAtoms; stop: () => unknown }]
    >();
  });

  test("injector infer type from moleculeInterface", () => {
    const ExampleInterface = moleculeInterface<{ value: number }>();
    expectTypeOf(() => injector.get(ExampleInterface)).returns.toEqualTypeOf<{
      value: number;
    }>();
  });

  test("injector infer type from generic molecule", () => {
    function useMoleculeGeneric<T>(molecule: Molecule<T>) {
      const value = injector.get(molecule);
      expectTypeOf({ value }).toEqualTypeOf<{ value: T }>();
      return value;
    }

    expectTypeOf(() => {
      return useMoleculeGeneric({} as any);
    }).returns.toEqualTypeOf<unknown>();

    expectTypeOf(() => {
      return useMoleculeGeneric(molecule(() => 2));
    }).returns.toEqualTypeOf<number>();

    expectTypeOf(() => {
      return useMoleculeGeneric(molecule(() => ({ a: 1, b: "test" as const })));
    }).returns.toEqualTypeOf<{ a: number; b: "test" }>();
  });
});

test("returns the same values for dependency-free molecule", () => {
  const injector = createInjector();

  const firstValue = injector.get(exampleMol);
  const secondValue = injector.get(exampleMol);

  expect(firstValue).toBe(secondValue);
});

describe("Derived molecules", () => {
  const derivedMol = molecule((mol) => {
    const base = mol(exampleMol);
    return { base, ageAtom: atom(`${Math.random()}`) };
  });

  const doubleDerived = molecule((mol) => {
    const base = mol(exampleMol);
    const derived = mol(derivedMol);
    return {
      base,
      derived,
    };
  });

  function testDerived(mol: Molecule<{ base: unknown }>) {
    const injector = createInjector();

    const firstValue = injector.get(mol);
    const secondValue = injector.get(mol);
    const firstBaseValue = injector.get(exampleMol);
    const secondBaseValue = injector.get(exampleMol);

    // All should be the same value
    expect(firstValue).toBe(secondValue);
    expect(firstBaseValue).toBe(secondBaseValue);

    expect(firstValue.base).toBe(firstBaseValue);
    expect(secondValue.base).toBe(secondBaseValue);
    expect(firstValue.base).toBe(secondBaseValue);
    expect(secondValue.base).toBe(firstBaseValue);
  }

  test("returns the same value for derived molecule", () => {
    testDerived(derivedMol);
  });

  test("returns the same value for 2nd order derived molecule", () => {
    testDerived(doubleDerived);
  });
});

test("two injectors return different molecules", () => {
  const injector1 = createInjector();
  const injector2 = createInjector();

  const firstValue = injector1.get(exampleMol);
  const secondValue = injector2.get(exampleMol);

  expect(firstValue).not.toBe(secondValue);
});

describe("Scoping", () => {
  test("Creates one molecule per scope, if not dependent on scope", () => {
    const injector = createInjector();
    const firstValue = injector.get(exampleMol);
    const secondValue = injector.get(exampleMol, user1Scope);
    const thirdValue = injector.get(exampleMol, company1Scope);
    const fourthValue = injector.get(exampleMol, company1Scope, user1Scope);
    // Molecule doesn't depend on scope, should be the same
    expect(firstValue).toBe(secondValue);
    expect(firstValue).toBe(thirdValue);
    expect(firstValue).toBe(fourthValue);
  });

  test("Creates one molecule, if no scope provided", () => {
    const injector = createInjector();
    const firstValue = injector.get(companyMolecule);
    const secondValue = injector.get(companyMolecule);
    // Should be one molecule, with default scope value
    expect(firstValue).toBe(secondValue);
  });

  test("Creates one molecule per dependent scope", () => {
    //
    const injector = createInjector();

    const firstValue = injector.get(companyMolecule, company1Scope);
    const secondValue = injector.get(companyMolecule, company2Scope);
    const thirdValue = injector.get(companyMolecule);

    // Molecule depends on scope, should be different for each scope
    expect(firstValue).not.toBe(secondValue);
    expect(firstValue).not.toBe(thirdValue);
    expect(thirdValue).not.toBe(secondValue);
  });

  test("Creates only one molecule per dependent scope", () => {
    const injector = createInjector();

    const firstValue = injector.get(companyMolecule, company1Scope);
    const secondValue = injector.get(companyMolecule, company1Scope);

    // Molecole depends on scope, should produce the same element for the same scope
    expect(firstValue).toBe(secondValue);
  });

  test("Creates one molecule per dependent molecule that is scope dependent", () => {
    const injector = createInjector();

    const firstValue = injector.get(userMolecule, company1Scope, user1Scope);
    const secondValue = injector.get(userMolecule, company2Scope, user1Scope);
    const thirdValue = injector.get(userMolecule, user1Scope);

    // Molecule has a TRANSITIVE dependency on scope via another molecule
    // So should be a different molecule every time
    expect(firstValue.company).toBe(company1Scope[1]);
    expect(secondValue.company).toBe(company2Scope[1]);
    expect(thirdValue.company).toBe(CompanyScope.defaultValue);

    expect(firstValue).not.toBe(secondValue);
    expect(firstValue).not.toBe(thirdValue);
    expect(secondValue).not.toBe(thirdValue);
  });

  test("Creates one molecule per dependent molecule that is scope dependent", () => {
    const injector = createInjector();

    const firstValue = injector.get(userMolecule, company1Scope, user1Scope);
    const secondValue = injector.get(userMolecule, company1Scope, user2Scope);

    // Molecule has a direct dependency AND a transitive dependency
    // Should be different for each direct dependency when the transitive dependency is unchanged
    expect(firstValue.company).toBe(company1Scope[1]);
    expect(secondValue.company).toBe(company1Scope[1]);

    expect(firstValue).not.toBe(secondValue);

    expect(firstValue.userId).toBe(user1Scope[1]);
    expect(secondValue.userId).toBe(user2Scope[1]);
  });

  test("Creates ONLY one molecule per dependent molecule that is scope dependent", () => {
    const injector = createInjector();

    const firstValue = injector.get(userMolecule, company1Scope, user1Scope);
    const secondValue = injector.get(userMolecule, company1Scope, user1Scope);
    const thirdValue = injector.get(
      userMolecule,
      company1Scope,
      unrelatedScope1,
      user1Scope,
    );
    // Molecule has a direct dependency AND a transitive dependency
    // Should be the same for the same scope
    expect(firstValue).toBe(secondValue);
    expect(firstValue).toBe(thirdValue);
  });

  test("Creates ONLY one molecule per dependent molecule, regardless of scope order", () => {
    const injector = createInjector();

    const [firstValue, unsub1] = injector.use(
      userMolecule,
      company1Scope,
      user1Scope,
    );
    const [secondValue, unsub2] = injector.use(
      userMolecule,
      user1Scope,
      company1Scope,
    );
    const [thirdValue, unsub3] = injector.use(
      userMolecule,
      unrelatedScope1,
      user1Scope,
      company1Scope,
    );
    // Molecule has a direct dependency AND a transitive dependency
    // Should be the same for the same scope
    expect(firstValue).toBe(secondValue);
    expect(firstValue).toBe(thirdValue);
  });

  test("Works with highly nested molecules that depend on a top level scope", () => {
    const TopScope = createScope(0);
    const scope1: ScopeTuple<number> = [TopScope, 1];
    const scope2: ScopeTuple<number> = [TopScope, 2];
    const mol1 = molecule((_, getScope) => [1, getScope(TopScope)]);
    const mol2 = molecule((mol) => [2, mol(mol1)]);
    const mol3 = molecule((mol) => [3, mol(mol2)]);
    const mol4 = molecule((mol) => [4, mol(mol3)]);
    const mol5 = molecule((mol) => [5, mol(mol4)]);
    const mol6 = molecule((mol) => [6, mol(mol5)]);

    const injector = createInjector();

    const val6 = injector.get(mol6, scope1);
    const val5 = injector.get(mol5, scope1);
    const val4 = injector.get(mol4, scope1);
    const val3 = injector.get(mol3, scope1);
    const val2 = injector.get(mol2, scope1);
    const val1 = injector.get(mol1, scope1);
    const otherVal6 = injector.get(mol6, scope2);
    const defaultVal6 = injector.get(mol6);

    expect(val1).toStrictEqual([1, 1]);
    expect(val2).toStrictEqual([2, [1, 1]]);
    expect(val3).toStrictEqual([3, [2, [1, 1]]]);
    expect(val4).toStrictEqual([4, [3, [2, [1, 1]]]]);
    expect(val5).toStrictEqual([5, [4, [3, [2, [1, 1]]]]]);
    expect(val6).toStrictEqual([6, [5, [4, [3, [2, [1, 1]]]]]]);
    expect(otherVal6).toStrictEqual([6, [5, [4, [3, [2, [1, 2]]]]]]);
    expect(defaultVal6).toStrictEqual([6, [5, [4, [3, [2, [1, 0]]]]]]);

    expect(val6).not.toBe(otherVal6);
    expect(val6).not.toBe(defaultVal6);
  });

  describe("Cyclic dependencies", () => {
    test("Crashes with an error on cyclic dependencies", () => {
      const molLeft: Molecule<unknown> = molecule((mol) => [
        "left",
        mol(molRight),
      ]);
      const molRight: Molecule<unknown> = molecule((mol) => [
        "right",
        mol(molLeft),
      ]);
      const injector = createInjector();

      expect(() => injector.get(molLeft)).toThrowError();
      expect(() => injector.get(molRight)).toThrowError();
    });
  });

  describe("Transient dependencies in diamond patterns", () => {
    /*
    
    These tests are all based on the "Diamond Pattern",
    which captures a potential problem in intialization order

    See Diamond problem: https://en.wikipedia.org/wiki/Dependency_hell
    
    */
    const TopScope = createScope(0);
    const scope1: ScopeTuple<number> = [TopScope, 1];
    const scope2: ScopeTuple<number> = [TopScope, 2];

    const LeftScope = createScope("LS0");
    const leftScope1: ScopeTuple<string> = [LeftScope, "LS1"];
    const leftScope2: ScopeTuple<string> = [LeftScope, "LS2"];

    const RightScope = createScope("RS0");
    const rightScope1: ScopeTuple<string> = [RightScope, "RS1"];
    const rightScope2: ScopeTuple<string> = [RightScope, "RS2"];

    const BottomScope = createScope("BS0");
    const bottomScope1: ScopeTuple<string> = [BottomScope, "BS1"];
    const bottomScope2: ScopeTuple<string> = [BottomScope, "BS2"];

    const molTop = molecule((_, getScope) => ["top", getScope(TopScope)]);

    test("Works with a diamond pattern dependency tree", () => {
      const molLeft = molecule((mol) => ["left", mol(molTop)]);
      const molRight = molecule((mol) => ["right", mol(molTop)]);
      const molBottom = molecule((mol) => [
        "bottom",
        mol(molLeft),
        mol(molRight),
      ]);

      const injector = createInjector();

      const bottom0 = injector.get(molBottom);
      const bottom1 = injector.get(molBottom, scope1);
      const bottom2 = injector.get(molBottom, scope2);

      expect(bottom0).toStrictEqual([
        "bottom",
        ["left", ["top", 0]],
        ["right", ["top", 0]],
      ]);
      expect(bottom1).toStrictEqual([
        "bottom",
        ["left", ["top", 1]],
        ["right", ["top", 1]],
      ]);
      expect(bottom2).toStrictEqual([
        "bottom",
        ["left", ["top", 2]],
        ["right", ["top", 2]],
      ]);
    });

    test("Works with a diamond pattern dependency tree, with side scope dependencies", () => {
      const molLeft = molecule((mol, getScope) => [
        "left",
        getScope(LeftScope),
        mol(molTop),
      ]);
      const molRight = molecule((mol, getScope) => [
        "right",
        getScope(RightScope),
        mol(molTop),
      ]);
      const molBottom = molecule((mol, getScope) => [
        "bottom",
        getScope(BottomScope),
        mol(molLeft),
        mol(molRight),
      ]);

      const injector = createInjector();

      const bottom0 = injector.get(molBottom);
      const bottom1 = injector.get(
        molBottom,
        scope1,
        rightScope1,
        leftScope1,
        bottomScope1,
      );
      const bottom2 = injector.get(
        molBottom,
        scope2,
        rightScope2,
        leftScope2,
        bottomScope2,
      );

      expect(
        // Second call to get should return the same value
        injector.get(molBottom),
      ).toBe(bottom0);
      expect(bottom0).toStrictEqual([
        "bottom",
        "BS0",
        ["left", "LS0", ["top", 0]],
        ["right", "RS0", ["top", 0]],
      ]);
      expect(bottom0[2][2]).toBe(bottom0[3][2]);

      expect(
        // Second call to get should return the same value
        injector.get(molBottom, scope1, rightScope1, leftScope1, bottomScope1),
      ).toBe(bottom1);
      expect(bottom1).toStrictEqual([
        "bottom",
        "BS1",
        ["left", "LS1", ["top", 1]],
        ["right", "RS1", ["top", 1]],
      ]);
      expect(bottom1[2][2]).toBe(bottom1[3][2]);

      expect(
        // Second call to get should return the same value
        injector.get(molBottom, scope2, rightScope2, leftScope2, bottomScope2),
      ).toBe(bottom2);
      expect(bottom2).toStrictEqual([
        "bottom",
        "BS2",
        ["left", "LS2", ["top", 2]],
        ["right", "RS2", ["top", 2]],
      ]);
      expect(bottom2[2][2]).toBe(bottom2[3][2]);
    });

    test("Works with a diamond pattern dependency tree, with sibling dependency", () => {
      const molLeft = molecule((mol) => ["left", mol(molTop)]);
      const molRight = molecule((mol) => ["right", mol(molTop), mol(molLeft)]);

      const molBottom = molecule((mol) => [
        "bottom",
        mol(molLeft),
        mol(molRight),
      ]);

      const injector = createInjector();

      const bottom0 = injector.get(molBottom);
      const bottom1 = injector.get(molBottom, scope1);
      const bottom2 = injector.get(molBottom, scope2);

      expect(bottom0).toStrictEqual([
        "bottom",
        ["left", ["top", 0]],
        ["right", ["top", 0], ["left", ["top", 0]]],
      ]);
      expect(bottom1).toStrictEqual([
        "bottom",
        ["left", ["top", 1]],
        ["right", ["top", 1], ["left", ["top", 1]]],
      ]);
      expect(bottom2).toStrictEqual([
        "bottom",
        ["left", ["top", 2]],
        ["right", ["top", 2], ["left", ["top", 2]]],
      ]);
    });

    test("Works with a diamond pattern dependency tree, with a direct deep dependency", () => {
      const molLeft = molecule((mol) => ["left", mol(molTop)]);
      const molRight = molecule((mol) => ["right", mol(molTop)]);
      const molBottom = molecule((mol) => [
        "bottom",
        mol(molTop),
        mol(molLeft),
        mol(molRight),
      ]);

      const injector = createInjector();

      const bottom0 = injector.get(molBottom);
      const bottom1 = injector.get(molBottom, scope1);
      const bottom2 = injector.get(molBottom, scope2);

      expect(bottom0).toStrictEqual([
        "bottom",
        ["top", 0],
        ["left", ["top", 0]],
        ["right", ["top", 0]],
      ]);
      expect(bottom0[1]).toBe(bottom0[2][1]);
      expect(bottom0[1]).toBe(bottom0[3][1]);
      expect(bottom1).toStrictEqual([
        "bottom",
        ["top", 1],
        ["left", ["top", 1]],
        ["right", ["top", 1]],
      ]);
      expect(bottom1[1]).toBe(bottom1[2][1]);
      expect(bottom1[1]).toBe(bottom1[3][1]);

      expect(bottom2).toStrictEqual([
        "bottom",
        ["top", 2],
        ["left", ["top", 2]],
        ["right", ["top", 2]],
      ]);
      expect(bottom2[1]).toBe(bottom2[2][1]);
      expect(bottom2[1]).toBe(bottom2[3][1]);
    });

    test("Works with a deep diamond pattern dependency tree with a deep right tree", () => {
      const molLeft = molecule((mol) => ["left", mol(molTop)]);
      const molRight = molecule((mol) => ["right", mol(molTop)]);
      // Deep right tree
      const molRightLeft = molecule((mol) => ["left", mol(molRight)]);
      const molRightRight = molecule((mol) => ["right", mol(molRight)]);

      const molBottom = molecule((mol) => [
        "bottom",
        mol(molLeft),
        mol(molRightLeft),
        mol(molRightRight),
      ]);

      const injector = createInjector();

      const bottom0 = injector.get(molBottom);
      const bottom1 = injector.get(molBottom, scope1);
      const bottom2 = injector.get(molBottom, scope2);

      expect(bottom0).toStrictEqual([
        "bottom",
        ["left", ["top", 0]],
        ["left", ["right", ["top", 0]]],
        ["right", ["right", ["top", 0]]],
      ]);
      expect(bottom1).toStrictEqual([
        "bottom",
        ["left", ["top", 1]],
        ["left", ["right", ["top", 1]]],
        ["right", ["right", ["top", 1]]],
      ]);
      expect(bottom2).toStrictEqual([
        "bottom",
        ["left", ["top", 2]],
        ["left", ["right", ["top", 2]]],
        ["right", ["right", ["top", 2]]],
      ]);
    });
  });
});

describe("Validation", () => {
  test("Molecules will throw errors if `mol` is called asynchronously", async () => {
    const badMolecule = molecule((mol) => {
      // Okay -- runs sync
      mol(exampleMol);
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          try {
            // Not okay -- runs in a timeout
            resolve(mol(exampleMol));
          } catch (e) {
            reject(e);
          }
        }, 10),
      );
    });

    const injector1 = createInjector();

    const firstValue = injector1.get(badMolecule);
    await expect(firstValue).rejects.toThrow("o");
  });

  test("Molecules will throw errors if `scope` is called asynchronously", async () => {
    const badMolecule = molecule((_, scope) => {
      // Okay -- runs sync
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          try {
            // Not okay -- runs in a timeout
            resolve(scope(UserScope));
          } catch (e) {
            reject(e);
          }
        }, 10),
      );
    });

    const injector1 = createInjector();

    const firstValue = injector1.get(badMolecule);
    await expect(firstValue).rejects.toThrow("o");
  });

  describe("Bad dependencies", () => {
    const injector1 = createInjector();

    test("Molecules can't depend on garbage molecules", () => {
      const badMol = molecule(() => use(new Set() as any));
      expect(() => injector1.get(badMol)).toThrow(ErrorBadUse);
    });
    test("Molecules can't depend on garbage molecules", () => {
      const badMol = molecule((mol) => mol(new Set() as any));
      expect(() => injector1.get(badMol)).toThrow(ErrorInvalidMolecule);
    });
    test("Molecules can't depend on garbage scopes", () => {
      const badMol = molecule(() => use(new Set() as any));
      expect(() => injector1.get(badMol)).toThrow(ErrorBadUse);
    });
    test("Molecules can't depend on garbage scopes", () => {
      const badMol = molecule((_, scope) => scope(new Set() as any));
      expect(() => injector1.get(badMol)).toThrow(ErrorInvalidScope);
    });
  });

  describe("Validation for inputs to injector", () => {
    const injector1 = createInjector();

    test("Can't `get` a non-molecule", () => {
      expect(() => injector1.get(new Set() as any)).toThrow(
        ErrorInvalidMolecule,
      );
    });
    test("Can't `use` a non-molecule", () => {
      expect(() => injector1.use(new Map() as any)).toThrow(
        ErrorInvalidMolecule,
      );
    });
  });
});

describe("Binding", () => {
  interface HTTPService {
    identity: string;
    get(url: string): Promise<string>;
    post(url: string): Promise<string>;
  }

  const HTTPService = moleculeInterface<HTTPService>();

  const NeedsHttp = molecule((mol) => {
    const httpService = mol(HTTPService);

    const logout = () => httpService.post("/logout");
    return {
      httpService,
      logout,
    };
  });

  test("Errors when a molecule interface is not bound", () => {
    const injector1 = createInjector();
    expect(() => injector1.get(HTTPService)).toThrow(ErrorUnboundMolecule);
  });

  describe("Allows binding a molecule interface to a molecule", () => {
    const MockHTTPMolecule = molecule<HTTPService>(() => {
      return {
        identity: "MockHTTP",
        async get(url) {
          return "I am fake";
        },
        async post(url) {
          return "I am fake";
        },
      };
    });

    test("Injects bindings into downstream dependencies", () => {
      const injector1 = createInjector({
        bindings: [[HTTPService, MockHTTPMolecule]],
      });

      const firstValue = injector1.get(NeedsHttp);
      expect(firstValue.logout).not.toBeNull();

      const bound = injector1.get(HTTPService);
      expect(bound).toBe(firstValue.httpService);
    });

    describe("Work with tuple bindings", () => {
      const arrayBindings = [[HTTPService, MockHTTPMolecule]];
      const injector1 = createInjector({
        bindings: [[HTTPService, MockHTTPMolecule]],
      });

      test("injects the right values", () => {
        expect(injector1.get(HTTPService).identity).toBe("MockHTTP");
      });
      test("doesn't update the injector when the bindings array is mutated", () => {
        arrayBindings.pop();
        expect(arrayBindings).toStrictEqual([]);
        expect(injector1.get(HTTPService).identity).toBe("MockHTTP");
      });
    });

    describe("Works with map bindings", () => {
      const mapBindings = new Map();
      mapBindings.set(HTTPService, MockHTTPMolecule);
      const injector1 = createInjector({
        bindings: mapBindings,
      });

      test("injects the right values", () => {
        expect(injector1.get(HTTPService).identity).toBe("MockHTTP");
      });

      test("doesn't update the injector when the map is mutated", () => {
        mapBindings.delete(HTTPService);
        expect(injector1.get(HTTPService).identity).toBe("MockHTTP");
      });
    });
  });

  test("Allows binding a molecule interface to a scoped molecule", async () => {
    const UserScopedHTTPMolecule = molecule<HTTPService>((_, getScope) => {
      const user = getScope(UserScope);
      return {
        identity: "UserScopedHTTP",
        async get(url) {
          return `I am ${user}`;
        },
        async post(url) {
          return `I am ${user}`;
        },
      };
    });

    const injector1 = createInjector({
      bindings: [[HTTPService, UserScopedHTTPMolecule]],
    });

    const firstValue = injector1.get(NeedsHttp);

    const loggedOut = await firstValue.logout();
    expect(loggedOut).toBe("I am bob@example.com");

    const secondValue = injector1.get(NeedsHttp, user1Scope);

    const loggedOut2 = await secondValue.logout();
    expect(loggedOut2).toBe("I am one@example.com");
  });
});

describe("Scope caching", () => {
  describe("Caches a scoped molecule", () => {
    const injector = createInjector();

    describe("String scopes", () => {
      const UserScoped = molecule(
        (_, scope) => scope(UserScope) + Math.random(),
      );
      test("It caches for overlapping leases", () => {
        const [mol1, unsub1] = injector.use(UserScoped, [
          UserScope,
          "one@example.com",
        ]);
        const [mol2, unsub2] = injector.use(UserScoped, [
          UserScope,
          "one@example.com",
        ]);
        expect(mol1).toBe(mol2);

        unsub1();
        unsub2();
      });

      test("It does not cache when leases are not overlapping", () => {
        const [mol1, unsub1] = injector.use(UserScoped, [
          UserScope,
          "one@example.com",
        ]);
        unsub1();
        const [mol2, unsub2] = injector.use(UserScoped, [
          UserScope,
          "one@example.com",
        ]);
        unsub2();

        expect(mol1).not.toBe(mol2);
      });
    });
    describe("Objects scopes", () => {
      const objectScope = createScope(new Set());

      const ObjectScopedMol = molecule(
        (_, scope) => new Set(scope(objectScope).entries()),
      );

      test("It caches for overlapping leases", () => {
        const testSet = new Set();
        const [mol1, unsub1] = injector.use(ObjectScopedMol, [
          objectScope,
          testSet,
        ]);
        const [mol2, unsub2] = injector.use(ObjectScopedMol, [
          objectScope,
          testSet,
        ]);
        expect(mol1).toBe(mol2);
        unsub1();
        unsub2();
      });

      test("It does NOT cache when leases are not overlapping", () => {
        // Note: Behaviour changed in Version 2.1

        const testSet = new Set();
        const [mol1, unsub1] = injector.use(ObjectScopedMol, [
          objectScope,
          testSet,
        ]);
        unsub1();
        const [mol2, unsub2] = injector.use(ObjectScopedMol, [
          objectScope,
          testSet,
        ]);
        unsub2();

        expect(mol1).not.toBe(mol2);
      });
    });
  });

  describe("Default scope caching", () => {
    test("returns same molecule instance when accessed with same explicit scope values", () => {
      const injector = createInjector();

      // Create two scopes: one that will vary, one that uses its default value
      const VaryingScope = createScope<string>("default-varying");
      const DefaultScope = createScope<number>(42);

      // Molecule depends on both scopes
      const testMol = molecule((_, getScope) => {
        const varying = getScope(VaryingScope);
        const def = getScope(DefaultScope); // Uses default value
        return { varying, def };
      });

      // Create molecule with explicit scope value "A"
      const [val1, unsub1] = injector.use(testMol, [VaryingScope, "A"]);
      expect(val1.varying).toBe("A");
      expect(val1.def).toBe(42);

      // Create with different explicit scope value "B"
      const [val2, unsub2] = injector.use(testMol, [VaryingScope, "B"]);
      expect(val2.varying).toBe("B");
      expect(val2.def).toBe(42);

      // Access again with original value "A" while both subscriptions are active
      // The cache should return the same molecule instance (val1)
      // and properly maintain the lease on the default scope
      const [val3, unsub3] = injector.use(testMol, [VaryingScope, "A"]);

      // Verify we get the cached instance
      expect(val3).toBe(val1);
      expect(val3.varying).toBe("A");

      unsub1();
      unsub2();
      unsub3();
    });
  });

  describe("Multi-scope cleanup behavior", () => {
    test("maintains cache integrity during out-of-order cleanup with multiple scopes", () => {
      const injector = createInjector();
      const Scope1 = createScope<string>("default1");
      const Scope2 = createScope<number>(0);

      const complexMol = molecule((_, getScope) => {
        const s1 = getScope(Scope1);
        const s2 = getScope(Scope2);
        return { s1, s2, id: Math.random() };
      });

      // Create molecules with various scope combinations
      const [v1, u1] = injector.use(complexMol, [Scope1, "A"], [Scope2, 1]);
      const [v2, u2] = injector.use(complexMol, [Scope1, "A"], [Scope2, 2]);
      const [v3, u3] = injector.use(complexMol, [Scope1, "B"], [Scope2, 1]);

      // Each combination should produce a different molecule instance
      expect(v1).not.toBe(v2);
      expect(v1).not.toBe(v3);
      expect(v2).not.toBe(v3);

      // Verify scope values
      expect(v1.s1).toBe("A");
      expect(v1.s2).toBe(1);
      expect(v2.s1).toBe("A");
      expect(v2.s2).toBe(2);
      expect(v3.s1).toBe("B");
      expect(v3.s2).toBe(1);

      // Clean up subscriptions in non-sequential order
      // The cache should handle partial cleanup gracefully
      u2(); // Remove middle entry
      u1(); // Remove first entry
      u3(); // Remove last entry

      // Verify cache still works after fragmented cleanup
      const [v4, u4] = injector.use(complexMol, [Scope1, "C"], [Scope2, 3]);
      expect(v4.s1).toBe("C");
      expect(v4.s2).toBe(3);

      // v4 is a new instance, different from all previous
      expect(v4).not.toBe(v1);
      expect(v4).not.toBe(v2);
      expect(v4).not.toBe(v3);

      // Test repeated creation/cleanup cycles with same scope values
      u4();
      const [v5, u5] = injector.use(complexMol, [Scope1, "C"], [Scope2, 3]);

      // After cleanup, new subscription should produce a different instance
      expect(v5).not.toBe(v4);
      expect(v5.s1).toBe("C");
      expect(v5.s2).toBe(3);

      // Verify the id changed (different instance)
      expect(v5.id).not.toBe(v4.id);

      u5();
    });
  });

  describe("Parent injectors", () => {
    interface APIService {
      fetch(): string;
    }
    interface CacheService {
      get(key: string): any;
      set(key: string, value: any): void;
    }

    const APIServiceInterface = moleculeInterface<APIService>();
    const CacheServiceInterface = moleculeInterface<CacheService>();

    const MockAPIMolecule = molecule(() => ({
      fetch: () => "mocked-api-data",
    }));

    const MemoryCacheMolecule = molecule(() => {
      const cache = new Map();
      return {
        get: (key: string) => cache.get(key),
        set: (key: string, value: any) => cache.set(key, value),
      };
    });

    const ComposedServiceMolecule = molecule((get) => {
      const api = get(APIServiceInterface);
      const cache = get(CacheServiceInterface);
      return {
        getData: () => {
          const cached = cache.get("data");
          if (cached) return cached;
          const data = api.fetch();
          cache.set("data", data);
          return data;
        },
      };
    });

    test("child injector inherits parent bindings", () => {
      const parentInjector = createInjector({
        bindings: [[APIServiceInterface, MockAPIMolecule]],
      });

      const childInjector = createInjector({
        parent: parentInjector,
        bindings: [[CacheServiceInterface, MemoryCacheMolecule]],
      });

      const service = childInjector.get(ComposedServiceMolecule);
      expect(service.getData()).toBe("mocked-api-data");
    });

    test("child injector overrides parent bindings", () => {
      const OverrideAPIMolecule = molecule(() => ({
        fetch: () => "override-data",
      }));

      const parentInjector = createInjector({
        bindings: [[APIServiceInterface, MockAPIMolecule]],
      });

      const childInjector = createInjector({
        parent: parentInjector,
        bindings: [
          [APIServiceInterface, OverrideAPIMolecule], // Override parent
          [CacheServiceInterface, MemoryCacheMolecule],
        ],
      });

      const service = childInjector.get(ComposedServiceMolecule);
      expect(service.getData()).toBe("override-data");
    });

    test("child injector inherits molecules created before its creation", () => {
      let creationCount = 0;
      const SharedMolecule = molecule(() => {
        creationCount++;
        return { id: creationCount };
      });

      const parentInjector = createInjector({
        bindings: [[APIServiceInterface, MockAPIMolecule]],
      });

      // Create molecule in parent first - this adds it to parent's cache
      const parentInstance = parentInjector.get(SharedMolecule);

      // Now create child injector - it inherits the parent's cache
      const childInjector = createInjector({
        parent: parentInjector,
        bindings: [[CacheServiceInterface, MemoryCacheMolecule]],
      });

      // Child should access the same instance from the shared cache
      const childInstance = childInjector.get(SharedMolecule);

      expect(parentInstance).toBe(childInstance);
      expect(creationCount).toBe(1); // Only created once in parent
    });

    test("parent can access molecules created in child (bidirectional cache)", () => {
      let creationCount = 0;
      const SharedMolecule = molecule(() => {
        creationCount++;
        return { id: creationCount };
      });

      const parentInjector = createInjector({
        bindings: [[APIServiceInterface, MockAPIMolecule]],
      });

      const childInjector = createInjector({
        parent: parentInjector,
        bindings: [[CacheServiceInterface, MemoryCacheMolecule]],
      });

      // Create molecule in child first - this should add it to shared cache
      const childInstance = childInjector.get(SharedMolecule);

      // Parent should access the same instance from the shared cache
      const parentInstance = parentInjector.get(SharedMolecule);

      expect(parentInstance).toBe(childInstance);
      expect(creationCount).toBe(1); // Only created once in child
    });

    test("scoped molecules have consistent behavior between parent and child", () => {
      let creationCount = 0;
      const ScopedMolecule = molecule((get, getScope) => {
        const scope = getScope(UserScope);
        creationCount++;
        return { id: creationCount, user: scope };
      });

      const parentInjector = createInjector({
        bindings: [[APIServiceInterface, MockAPIMolecule]],
      });

      const childInjector = createInjector({
        parent: parentInjector,
        bindings: [[CacheServiceInterface, MemoryCacheMolecule]],
      });

      // Create scoped molecule in parent
      const [parentInstance, parentUnsub] = parentInjector.use(ScopedMolecule, [
        UserScope,
        "user123",
      ]);

      // Access same scoped molecule from child
      const [childInstance, childUnsub] = childInjector.use(ScopedMolecule, [
        UserScope,
        "user123",
      ]);

      // Both should have the same user scope value
      expect(parentInstance.user).toBe("user123");
      expect(childInstance.user).toBe("user123");

      // Both should work with same scope value
      expect(parentInstance.user).toBe(childInstance.user);

      parentUnsub();
      childUnsub();
    });

    test("child modifications affect parent cache", () => {
      let globalState = { counter: 0 };
      const StatefulMolecule = molecule(() => {
        globalState.counter++;
        return {
          increment: () => globalState.counter++,
          getCount: () => globalState.counter,
        };
      });

      const parentInjector = createInjector({
        bindings: [[APIServiceInterface, MockAPIMolecule]],
      });

      const childInjector = createInjector({
        parent: parentInjector,
        bindings: [[CacheServiceInterface, MemoryCacheMolecule]],
      });

      // Get molecule from child first
      const childInstance = childInjector.get(StatefulMolecule);
      expect(childInstance.getCount()).toBe(1); // Initial creation

      // Modify state through child
      childInstance.increment();
      expect(childInstance.getCount()).toBe(2);

      // Get same molecule from parent - should see the modified state
      const parentInstance = parentInjector.get(StatefulMolecule);
      expect(parentInstance).toBe(childInstance); // Same instance
      expect(parentInstance.getCount()).toBe(2); // See the modification
    });

    test("parent modifications affect child cache", () => {
      let globalState = { value: "initial" };
      const MutableMolecule = molecule(() => ({
        setValue: (val: string) => {
          globalState.value = val;
        },
        getValue: () => globalState.value,
      }));

      const parentInjector = createInjector({
        bindings: [[APIServiceInterface, MockAPIMolecule]],
      });

      const childInjector = createInjector({
        parent: parentInjector,
        bindings: [[CacheServiceInterface, MemoryCacheMolecule]],
      });

      // Get molecule from parent first
      const parentInstance = parentInjector.get(MutableMolecule);
      expect(parentInstance.getValue()).toBe("initial");

      // Get same molecule from child - should see the modified state
      const childInstance = childInjector.get(MutableMolecule);
      expect(childInstance).toBe(parentInstance); // Same instance
      expect(childInstance.getValue()).toBe("initial");

      // Modify state through parent
      parentInstance.setValue("modified-by-parent");

      expect(parentInstance.getValue()).toBe("modified-by-parent"); // See the modification
      expect(childInstance.getValue()).toBe("modified-by-parent"); // See the modification
    });

    test("complex scoped molecules with interface dependencies work across injectors", () => {
      let creationCount = 0;
      const ComplexServiceMolecule = molecule((get, getScope) => {
        const user = getScope(UserScope);
        const api = get(APIServiceInterface);
        creationCount++;

        return {
          id: creationCount,
          user,
          fetchUserData: () => `${api.fetch()}-for-${user}`,
          getUserInfo: () => `info-${user}`,
        };
      });

      const parentInjector = createInjector({
        bindings: [[APIServiceInterface, MockAPIMolecule]],
      });

      const childInjector = createInjector({
        parent: parentInjector,
        bindings: [[CacheServiceInterface, MemoryCacheMolecule]],
      });

      // Create scoped service in parent
      const [parentService, parentUnsub] = parentInjector.use(
        ComplexServiceMolecule,
        [UserScope, "alice"],
      );

      // Access same scoped service from child
      const [childService, childUnsub] = childInjector.use(
        ComplexServiceMolecule,
        [UserScope, "alice"],
      );

      // Both should have access to the interface and same scope
      expect(childService.fetchUserData()).toBe("mocked-api-data-for-alice");
      expect(childService.getUserInfo()).toBe("info-alice");
      expect(parentService.user).toBe(childService.user); // Same scope value

      // Different scope should create new instance
      const [childService2, childUnsub2] = childInjector.use(
        ComplexServiceMolecule,
        [UserScope, "bob"],
      );

      expect(childService2).not.toBe(childService);
      expect(childService2.user).toBe("bob");
      expect(childService2.getUserInfo()).toBe("info-bob");

      parentUnsub();
      childUnsub();
      childUnsub2();
    });

    test("deeply nested injector hierarchy works", () => {
      const LoggerInterface = moleculeInterface<{
        log: (msg: string) => void;
      }>();

      const ConsoleLoggerMolecule = molecule(() => ({
        log: (msg: string) => console.log(msg),
      }));

      const grandParentInjector = createInjector({
        bindings: [[APIServiceInterface, MockAPIMolecule]],
      });

      const parentInjector = createInjector({
        parent: grandParentInjector,
        bindings: [[CacheServiceInterface, MemoryCacheMolecule]],
      });

      const childInjector = createInjector({
        parent: parentInjector,
        bindings: [[LoggerInterface, ConsoleLoggerMolecule]],
      });

      // Child should access all three interfaces
      const api = childInjector.get(APIServiceInterface);
      const cache = childInjector.get(CacheServiceInterface);
      const logger = childInjector.get(LoggerInterface);

      expect(api.fetch()).toBe("mocked-api-data");
      expect(cache).toBeDefined();
      expect(logger).toBeDefined();
    });

    test("deeply nested injector hierarchy (>3 levels) works", () => {
      const APIServiceInterface = moleculeInterface<{ fetch(): string }>();
      const MockAPIMolecule = molecule(() => ({ fetch: () => "deep-mock" }));

      const level1 = createInjector({
        bindings: [[APIServiceInterface, MockAPIMolecule]],
      });
      const level2 = createInjector({ parent: level1 });
      const level3 = createInjector({ parent: level2 });
      const level4 = createInjector({ parent: level3 });
      const level5 = createInjector({ parent: level4 });

      const api = level5.get(APIServiceInterface);
      expect(api.fetch()).toBe("deep-mock");
    });
  });
});

describe("Global molecule internal scopes", () => {
  test("Each global molecule gets its own unique internal scope", () => {
    const injector = createInjector();

    const GlobalMol1 = molecule(() => ({ value: Math.random() }));
    const GlobalMol2 = molecule(() => ({ value: Math.random() }));

    // Both molecules should work without errors
    const [val1, unsub1] = injector.use(GlobalMol1);
    const [val2, unsub2] = injector.use(GlobalMol2);

    expect(val1).toBeDefined();
    expect(val2).toBeDefined();
    expect(val1).not.toBe(val2);

    // Check that each molecule has its own internal scope using the proper symbol
    const scope1 = (GlobalMol1 as any)[GlobalScopeSymbol];
    const scope2 = (GlobalMol2 as any)[GlobalScopeSymbol];
    expect(scope1).toBeDefined();
    expect(scope2).toBeDefined();
    expect(scope1).not.toBe(scope2);
    expect(scope1.defaultValue).toBeDefined();
    expect(scope2.defaultValue).toBeDefined();
    expect(scope1.defaultValue).not.toBe(scope2.defaultValue);

    unsub1();
    unsub2();
  });

  test("Global molecule reuses the same internal scope across multiple uses", () => {
    const injector = createInjector();

    let executionCount = 0;
    const GlobalMol = molecule(() => {
      executionCount++;
      return { value: executionCount };
    });

    // Use the molecule multiple times
    const [val1, unsub1] = injector.use(GlobalMol);
    const internalScope1 = (GlobalMol as MoleculeInternal<any>)[
      GlobalScopeSymbol
    ];
    expect(internalScope1).toBeDefined();

    const [val2, unsub2] = injector.use(GlobalMol);
    const internalScope2 = (GlobalMol as MoleculeInternal<any>)[
      GlobalScopeSymbol
    ];

    const [val3, unsub3] = injector.use(GlobalMol);
    const internalScope3 = (GlobalMol as MoleculeInternal<any>)[
      GlobalScopeSymbol
    ];

    // Should all be the same instance (molecule executed only once)
    expect(val1).toBe(val2);
    expect(val2).toBe(val3);
    expect(executionCount).toBe(1);

    // Internal scope should be the same object across all uses
    expect(internalScope1).toBe(internalScope2);
    expect(internalScope2).toBe(internalScope3);

    // Verify it's a stable symbol value
    expect(typeof internalScope1?.defaultValue).toBe("symbol");

    unsub1();
    unsub2();
    unsub3();
  });

  test("Global molecule reuses the same internal scope even after being released", () => {
    const injector = createInjector();

    let executionCount = 0;
    const GlobalMol = molecule(() => {
      executionCount++;
      return { value: executionCount };
    });

    // Use the molecule and release it
    const [val1, unsub1] = injector.use(GlobalMol);
    const internalScope1 = (GlobalMol as MoleculeInternal<any>)[
      GlobalScopeSymbol
    ];
    expect(internalScope1).toBeDefined();
    expect(executionCount).toBe(1);
    unsub1();

    // Uses it again after releasing
    const [val2, unsub2] = injector.use(GlobalMol);
    const internalScope2 = (GlobalMol as MoleculeInternal<any>)[
      GlobalScopeSymbol
    ];
    expect(executionCount).toBe(2);
    unsub2();

    // Internal scope should be the same object across all uses
    expect(internalScope1).toBe(internalScope2);
  });

  test("Global molecule should call onUnmount even if another global molecule is still in use", () => {
    // See https://github.com/saasquatch/bunshi/issues/80

    const injector = createInjector();

    let mountCount1 = 0;
    let mountCleanupCount1 = 0;
    let unmountCount1 = 0;

    const GlobalMol1 = molecule(() => {
      mountCount1++;
      onMount(() => {
        return () => {
          mountCleanupCount1++;
        };
      });
      onUnmount(() => {
        unmountCount1++;
      });
      return { value: mountCount1 };
    });

    let mountCount2 = 0;
    let mountCleanupCount2 = 0;
    let unmountCount2 = 0;

    const GlobalMol2 = molecule(() => {
      mountCount2++;
      onMount(() => {
        return () => {
          mountCleanupCount2++;
        };
      });
      onUnmount(() => {
        unmountCount2++;
      });
      return { value: mountCount2 };
    });

    // First use of both molecules
    const [val1, unsub1] = injector.use(GlobalMol1);
    expect(mountCount1).toBe(1);
    expect(mountCount2).toBe(0);

    const [val2, unsub2] = injector.use(GlobalMol2);
    expect(mountCount1).toBe(1);
    expect(mountCount2).toBe(1);

    // Release first molecule
    unsub1();
    expect(mountCleanupCount1).toBe(1);
    expect(unmountCount1).toBe(1);

    // Second use of first molecule (should create new instance)
    const [val3, unsub3] = injector.use(GlobalMol1);
    expect(val3).not.toBe(val1);
    expect(mountCount1).toBe(2);

    // Release second molecule
    unsub2();
    expect(mountCleanupCount2).toBe(1);
    expect(unmountCount2).toBe(1);

    // Release first molecule again
    unsub3();
    expect(mountCleanupCount1).toBe(2);
    expect(unmountCount1).toBe(2);
  });

  test("Global molecule is properly cleaned up after all references are released", () => {
    const injector = createInjector();

    let mountCount = 0;
    let unmountCount = 0;

    const GlobalMol = molecule(() => {
      mountCount++;
      onMount(() => {
        return () => {
          unmountCount++;
        };
      });
      return { value: mountCount };
    });

    // First use
    const [val1, unsub1] = injector.use(GlobalMol);
    expect(mountCount).toBe(1);
    expect(unmountCount).toBe(0);

    // Second use (should reuse the same instance)
    const [val2, unsub2] = injector.use(GlobalMol);
    expect(val1).toBe(val2);
    expect(mountCount).toBe(1);
    expect(unmountCount).toBe(0);

    // Release first reference
    unsub1();
    expect(unmountCount).toBe(0); // Should still be mounted

    // Release second reference
    unsub2();
    expect(unmountCount).toBe(1); // Should now be unmounted

    // Use again (should create new instance)
    const [val3, unsub3] = injector.use(GlobalMol);
    expect(val3).not.toBe(val1);
    expect(mountCount).toBe(2);
    expect(unmountCount).toBe(1);

    unsub3();
    expect(unmountCount).toBe(2);
  });

  test("Global molecule works correctly when mixed with scoped molecules", () => {
    const injector = createInjector();

    const GlobalMol = molecule(() => ({ global: Math.random() }));
    const ScopedMol = molecule((mol, scope) => {
      const globalValue = mol(GlobalMol);
      const userId = scope(UserScope);
      return { globalValue, userId };
    });

    const [scoped1, unsub1] = injector.use(ScopedMol, user1Scope);
    const [scoped2, unsub2] = injector.use(ScopedMol, user2Scope);

    // Both scoped molecules should share the same global molecule instance
    expect(scoped1.globalValue).toBe(scoped2.globalValue);
    // But have different user IDs
    expect(scoped1.userId).not.toBe(scoped2.userId);

    unsub1();
    unsub2();
  });

  test("Deeply nested global molecules work correctly", () => {
    const injector = createInjector();

    const GlobalMol1 = molecule(() => ({ level: 1 }));
    const GlobalMol2 = molecule((mol) => {
      const mol1 = mol(GlobalMol1);
      return { level: 2, parent: mol1 };
    });
    const GlobalMol3 = molecule((mol) => {
      const mol2 = mol(GlobalMol2);
      return { level: 3, parent: mol2 };
    });

    const [val, unsub] = injector.use(GlobalMol3);

    expect(val.level).toBe(3);
    expect(val.parent.level).toBe(2);
    expect(val.parent.parent.level).toBe(1);

    // Each nested molecule should have its own internal scope
    const scope1 = (GlobalMol1 as MoleculeInternal<any>)[GlobalScopeSymbol];
    const scope2 = (GlobalMol2 as MoleculeInternal<any>)[GlobalScopeSymbol];
    const scope3 = (GlobalMol3 as MoleculeInternal<any>)[GlobalScopeSymbol];
    expect(scope1).toBeDefined();
    expect(scope2).toBeDefined();
    expect(scope3).toBeDefined();
    expect(scope1).not.toBe(scope2);
    expect(scope2).not.toBe(scope3);
    expect(scope1).not.toBe(scope3);

    unsub();
  });

  test("Scoped molecules do get an internal global scope", () => {
    const injector = createInjector();

    const ScopedMol = molecule((_, scope) => {
      const userId = scope(UserScope);
      return { userId };
    });

    const [val, unsub] = injector.use(ScopedMol, user1Scope);

    expect(val.userId).toBe(user1Scope[1]);

    const globalScope1 = (ScopedMol as MoleculeInternal<any>)[
      GlobalScopeSymbol
    ];
    expect(globalScope1).toBeDefined();

    const [val2, unsub2] = injector.use(ScopedMol, user2Scope);
    expect(val2.userId).toBe(user2Scope[1]);
    expect(val).not.toBe(val2);

    const globalScope2 = (ScopedMol as MoleculeInternal<any>)[
      GlobalScopeSymbol
    ];
    expect(globalScope2).toBeDefined();
    expect(globalScope1).toBe(globalScope2);

    unsub();
    unsub2();
  });

  test("Global scope internal values are unique symbols", () => {
    const injector = createInjector();

    const GlobalMol1 = molecule(() => ({ id: 1 }));
    const GlobalMol2 = molecule(() => ({ id: 2 }));

    injector.use(GlobalMol1);
    injector.use(GlobalMol2);

    const scope1 = (GlobalMol1 as MoleculeInternal<any>)[GlobalScopeSymbol];
    const scope2 = (GlobalMol2 as MoleculeInternal<any>)[GlobalScopeSymbol];

    // The default values should be unique symbols
    expect(typeof scope1?.defaultValue).toBe("symbol");
    expect(typeof scope2?.defaultValue).toBe("symbol");
    expect(scope1?.defaultValue).not.toBe(scope2?.defaultValue);

    // The symbols should have descriptive labels
    expect(scope1?.defaultValue.toString()).toMatch(
      /^Symbol\(bunshi\.global\.scope\.\d+\)$/,
    );
    expect(scope2?.defaultValue.toString()).toMatch(
      /^Symbol\(bunshi\.global\.scope\.\d+\)$/,
    );
  });
});

describe("lazyUse subscription errors", () => {
  const injector = createInjector();
  const testMol = molecule(() => ({ value: 1 }));

  test("throws error when starting an already active subscription", () => {
    const [_value, { start, stop }] = injector.useLazily(testMol);

    // Start the subscription
    start();

    // Try to start again - should throw
    expect(() => start()).toThrow(
      "Don't start a subscription that is already started.",
    );

    // Clean up
    stop();
  });

  test("throws error when stopping an already stopped subscription", () => {
    const [_value, { start, stop }] = injector.useLazily(testMol);

    // Start and then stop the subscription
    start();
    stop();

    // Try to stop again - should throw
    expect(() => stop()).toThrow(
      "Don't stop a subscription that is already stopped.",
    );
  });
});
