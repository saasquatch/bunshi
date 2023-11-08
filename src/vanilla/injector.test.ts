import { atom, PrimitiveAtom } from "jotai";
import { createInjector, getDefaultInjector } from "./injector";
import {
  ErrorInvalidGlobalInjector,
  ErrorInvalidMolecule,
  ErrorInvalidScope,
  ErrorUnboundMolecule,
} from "./internal/errors";
import { DefaultInjector } from "./internal/symbols";
import { Molecule, molecule, moleculeInterface } from "./molecule";
import { createScope } from "./scope";
import { ScopeTuple } from "./types";

type BaseAtoms = {
  nameAtom: PrimitiveAtom<string>;
};
const exampleMol = molecule<BaseAtoms>(() => {
  return {
    nameAtom: atom(`${Math.random()}`),
  };
});

const UnrelatedScope = createScope<number>(1);
const unrelatedScope1: ScopeTuple<number> = [UnrelatedScope, 1];

const UserScope = createScope<string>("bob@example.com");
const user1Scope: ScopeTuple<string> = [UserScope, "one@example.com"];
const user2Scope: ScopeTuple<string> = [UserScope, "two@example.com"];

const CompanyScope = createScope<string>("example.com");
const company1Scope: ScopeTuple<string> = [CompanyScope, "example.com"];
const company2Scope: ScopeTuple<string> = [CompanyScope, "foo.example.com"];

const userMolecule = molecule((mol, scope) => {
  const userId = scope(UserScope);
  const company = mol(companyMolecule);
  const userNameAtom = atom(userId + " name");
  const userCountryAtom = atom(userId + " country");
  const groupAtom = atom((get) => {
    return userId + " in " + get(company.companyNameAtom);
  });
  return {
    userId,
    userCountryAtom,
    userNameAtom,
    groupAtom,
    company: company.company,
  };
});

const companyMolecule = molecule((_, getScope) => {
  const company = getScope(CompanyScope);
  const companyNameAtom = atom(company.toUpperCase());
  return {
    company,
    companyNameAtom,
  };
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

  function testDerived(mol: typeof derivedMol) {
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
      user1Scope
    );
    // Molecule has a direct dependency AND a transitive dependency
    // Should be the same for the same scope
    expect(firstValue).toBe(secondValue);
    expect(firstValue).toBe(thirdValue);
  });

  test("Creates ONLY one molecule per dependent molecule, regardless of scope order", () => {
    const injector = createInjector();

    const firstValue = injector.get(userMolecule, company1Scope, user1Scope);
    const secondValue = injector.get(userMolecule, user1Scope, company1Scope);
    const thirdValue = injector.get(
      userMolecule,
      unrelatedScope1,
      user1Scope,
      company1Scope
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
        bottomScope1
      );
      const bottom2 = injector.get(
        molBottom,
        scope2,
        rightScope2,
        leftScope2,
        bottomScope2
      );

      expect(
        // Second call to get should return the same value
        injector.get(molBottom)
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
        injector.get(molBottom, scope1, rightScope1, leftScope1, bottomScope1)
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
        injector.get(molBottom, scope2, rightScope2, leftScope2, bottomScope2)
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
        }, 10)
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
        }, 10)
      );
    });

    const injector1 = createInjector();

    const firstValue = injector1.get(badMolecule);
    await expect(firstValue).rejects.toThrow("o");
  });

  describe("Bad dependencies", () => {
    const injector1 = createInjector();

    test("Molecules can't depend on garbage molecules", () => {
      const badMol = molecule((mol) => mol(new Set() as any));
      expect(() => injector1.get(badMol)).toThrow(ErrorInvalidMolecule);
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
        ErrorInvalidMolecule
      );
    });
    test("Can't `use` a non-molecule", () => {
      expect(() => injector1.use(new Map() as any)).toThrow(
        ErrorInvalidMolecule
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
  test("Caches a scope tuple", () => {
    const injector = createInjector();
    const [[tuple1], unsub1] = injector.useScopes([
      UserScope,
      "one@example.com",
    ]);
    const [[tuple2], unsub2] = injector.useScopes([
      UserScope,
      "one@example.com",
    ]);
    expect(tuple1).toBe(tuple2);

    unsub1();
    unsub2();
  });

  describe("Caches a scoped molecule", () => {
    const injector = createInjector();

    describe("String scopes", () => {
      const UserScoped = molecule(
        (_, scope) => scope(UserScope) + Math.random()
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
        (_, scope) => new Set(scope(objectScope).entries())
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
        // Note: Behaviour changed in Version 1.1

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

        expect(mol1).toBe(mol2);
      });
    });
  });

  test("Does not cache when scopes are cleaned up", () => {
    const injector = createInjector();
    const [[tuple1], unsub1] = injector.useScopes([
      UserScope,
      "one@example.com",
    ]);
    unsub1();

    // Note: GC / cleanup happens in here

    const [[tuple2], unsub2] = injector.useScopes([
      UserScope,
      "one@example.com",
    ]);
    unsub2();
    // Subscription 1 and 2 never overlapped
    expect(tuple1).not.toBe(tuple2);
  });

  test("Caches if there are overlapping subscriptions", () => {
    const injector = createInjector();
    const [[tuple1], unsub1] = injector.useScopes([
      UserScope,
      "one@example.com",
    ]);
    const [[tuple2], unsub2] = injector.useScopes([
      UserScope,
      "one@example.com",
    ]);
    unsub2();
    unsub1();
    // Subscription 2 overlapped with 1
    expect(tuple1).toBe(tuple2);
  });

  test("Caches as long as subscriptions overlap", () => {
    const injector = createInjector();
    const [[tuple1], unsub1] = injector.useScopes([
      UserScope,
      "one@example.com",
    ]);

    const [[tuple2], unsub2] = injector.useScopes([
      UserScope,
      "one@example.com",
    ]);

    // Doesn't create a new value, the second use has a lease
    unsub1();

    const [[tuple3], unsub3] = injector.useScopes([
      UserScope,
      "one@example.com",
    ]);
    unsub2();

    const [[tuple4], unsub4] = injector.useScopes([
      UserScope,
      "one@example.com",
    ]);
    unsub3();

    // Final cleanup
    unsub4();

    expect(tuple1).toBe(tuple2);
    expect(tuple1).toBe(tuple3);
    expect(tuple1).toBe(tuple4);
  });
});

describe("Global injector", () => {
  test("It always returns the same injector", () => {
    (globalThis as any)[DefaultInjector] = undefined;

    const one = getDefaultInjector();
    const two = getDefaultInjector();

    expect(one).toBe(two);

    (globalThis as any)[DefaultInjector] = undefined;

    const three = getDefaultInjector();
    expect(three).not.toBe(two);
  });

  test("It returns different objects if the global scope is nulled out", () => {
    (globalThis as any)[DefaultInjector] = undefined;
    const one = getDefaultInjector();

    (globalThis as any)[DefaultInjector] = undefined;
    const two = getDefaultInjector();
    expect(one).not.toBe(two);
  });

  test("It throws errors when global scoped is poluted with garbage", () => {
    // Pollute global scope with garbage
    (globalThis as any)[DefaultInjector] = {
      "I am a lot of": "Terrible garbage",
    };

    expect(getDefaultInjector).toThrow(ErrorInvalidGlobalInjector);

    // Cleanup garbage
    (globalThis as any)[DefaultInjector] = undefined;
  });
});
