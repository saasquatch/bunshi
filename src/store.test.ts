import { atom, PrimitiveAtom } from "jotai";
import {
  Molecule,
  molecule,
  ScopeTuple,
} from "./molecule";
import { createStore } from "./store";
import { createScope } from "./scope";

type BaseAtoms = {
  nameAtom: PrimitiveAtom<string>;
};
const exampleMol = molecule<BaseAtoms>(() => {
  return {
    nameAtom: atom(`${Math.random()}`),
  };
});

const derivedMol = molecule((getMol) => {
  const base = getMol(exampleMol);
  return { base, ageAtom: atom(`${Math.random()}`) };
});

const doubleDerived = molecule((getMol) => {
  const base = getMol(exampleMol);
  const derived = getMol(derivedMol);
  return {
    base,
    derived,
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

const userMolecule = molecule((getMol, getScope) => {
  const userId = getScope(UserScope);
  const company = getMol(companyMolecule);
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

describe("Store", () => {
  it("returns the same values for dependency-free molecule", () => {
    const store = createStore();

    const firstValue = store.get(exampleMol);
    const secondValue = store.get(exampleMol);

    expect(firstValue).toBe(secondValue);
  });

  ([derivedMol, doubleDerived] as Molecule<{ base: BaseAtoms }>[]).forEach(
    (mol) => {
      it("returns the same value for derived molecule", () => {
        const store = createStore();

        const firstValue = store.get(mol);
        const secondValue = store.get(mol);
        const firstBaseValue = store.get(exampleMol);
        const secondBaseValue = store.get(exampleMol);

        // All should be the same value
        expect(firstValue).toBe(secondValue);
        expect(firstBaseValue).toBe(secondBaseValue);

        expect(firstValue.base).toBe(firstBaseValue);
        expect(secondValue.base).toBe(secondBaseValue);
        expect(firstValue.base).toBe(secondBaseValue);
        expect(secondValue.base).toBe(firstBaseValue);
      });
    }
  );

  it("two stores return different molecules", () => {
    const store1 = createStore();
    const store2 = createStore();

    const firstValue = store1.get(exampleMol);
    const secondValue = store2.get(exampleMol);

    expect(firstValue).not.toBe(secondValue);
  });

  describe("Scoping", () => {
    it("Creates one molecule per scope, if not dependent on scope", () => {
      const store = createStore();
      const firstValue = store.get(exampleMol);
      const secondValue = store.get(exampleMol, user1Scope);
      const thirdValue = store.get(exampleMol, company1Scope);
      const fourthValue = store.get(exampleMol, company1Scope, user1Scope);
      // Molecule doesn't depend on scope, should be the same
      expect(firstValue).toBe(secondValue);
      expect(firstValue).toBe(thirdValue);
      expect(firstValue).toBe(fourthValue);
    });

    it("Creates one molecule, if no scope provided", () => {
      const store = createStore();
      const firstValue = store.get(companyMolecule);
      const secondValue = store.get(companyMolecule);
      // Should be one molecule, with default scope value
      expect(firstValue).toBe(secondValue);
    });

    it("Creates one molecule per dependent scope", () => {
      //
      const store = createStore();

      const firstValue = store.get(companyMolecule, company1Scope);
      const secondValue = store.get(companyMolecule, company2Scope);
      const thirdValue = store.get(companyMolecule);

      // Molecule depends on scope, should be different for each scope
      expect(firstValue).not.toBe(secondValue);
      expect(firstValue).not.toBe(thirdValue);
      expect(thirdValue).not.toBe(secondValue);
    });

    it("Creates only one molecule per dependent scope", () => {
      const store = createStore();

      const firstValue = store.get(companyMolecule, company1Scope);
      const secondValue = store.get(companyMolecule, company1Scope);

      // Molecole depends on scope, should produce the same element for the same scope
      expect(firstValue).toBe(secondValue);
    });

    it("Creates one molecule per dependent molecule that is scope dependent", () => {
      const store = createStore();

      const firstValue = store.get(userMolecule, company1Scope, user1Scope);
      const secondValue = store.get(userMolecule, company2Scope, user1Scope);
      const thirdValue = store.get(userMolecule, user1Scope);

      // Molecule has a TRANSITIVE dependency on scope via another molecule
      // So should be a different molecule every time
      expect(firstValue.company).toBe(company1Scope[1]);
      expect(secondValue.company).toBe(company2Scope[1]);
      expect(thirdValue.company).toBe(CompanyScope.defaultValue);

      expect(firstValue).not.toBe(secondValue);
      expect(firstValue).not.toBe(thirdValue);
      expect(secondValue).not.toBe(thirdValue);
    });

    it("Creates one molecule per dependent molecule that is scope dependent", () => {
      const store = createStore();

      const firstValue = store.get(userMolecule, company1Scope, user1Scope);
      const secondValue = store.get(userMolecule, company1Scope, user2Scope);

      // Molecule has a direct dependency AND a transitive dependency
      // Should be different for each direct dependency when the transitive dependency is unchanged
      expect(firstValue.company).toBe(company1Scope[1]);
      expect(secondValue.company).toBe(company1Scope[1]);

      expect(firstValue).not.toBe(secondValue);

      expect(firstValue.userId).toBe(user1Scope[1]);
      expect(secondValue.userId).toBe(user2Scope[1]);
    });

    it("Creates ONLY one molecule per dependent molecule that is scope dependent", () => {
      const store = createStore();

      const firstValue = store.get(userMolecule, company1Scope, user1Scope);
      const secondValue = store.get(userMolecule, company1Scope, user1Scope);
      const thirdValue = store.get(
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

    it("Creates ONLY one molecule per dependent molecule, regardless of scope order", () => {
      const store = createStore();

      const firstValue = store.get(userMolecule, company1Scope, user1Scope);
      const secondValue = store.get(userMolecule, user1Scope, company1Scope);
      const thirdValue = store.get(
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

    it("Works with highly nested molecules that depend on a top level scope", () => {
      const TopScope = createScope(0);
      const scope1: ScopeTuple<number> = [TopScope, 1];
      const scope2: ScopeTuple<number> = [TopScope, 2];
      const mol1 = molecule((_, getScope) => [1, getScope(TopScope)]);
      const mol2 = molecule((getMol) => [2, getMol(mol1)]);
      const mol3 = molecule((getMol) => [3, getMol(mol2)]);
      const mol4 = molecule((getMol) => [4, getMol(mol3)]);
      const mol5 = molecule((getMol) => [5, getMol(mol4)]);
      const mol6 = molecule((getMol) => [6, getMol(mol5)]);

      const store = createStore();

      const val6 = store.get(mol6, scope1);
      const val5 = store.get(mol5, scope1);
      const val4 = store.get(mol4, scope1);
      const val3 = store.get(mol3, scope1);
      const val2 = store.get(mol2, scope1);
      const val1 = store.get(mol1, scope1);
      const otherVal6 = store.get(mol6, scope2);
      const defaultVal6 = store.get(mol6);

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
      it("Crashes with an error on cyclic dependencies", () => {
        const molLeft: Molecule<unknown> = molecule((getMol) => [
          "left",
          getMol(molRight),
        ]);
        const molRight: Molecule<unknown> = molecule((getMol) => [
          "right",
          getMol(molLeft),
        ]);
        const store = createStore();

        expect(() => store.get(molLeft)).toThrowError();
        expect(() => store.get(molRight)).toThrowError();
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

      it("Works with a diamond pattern dependency tree", () => {
        const molLeft = molecule((getMol) => ["left", getMol(molTop)]);
        const molRight = molecule((getMol) => ["right", getMol(molTop)]);
        const molBottom = molecule((getMol) => [
          "bottom",
          getMol(molLeft),
          getMol(molRight),
        ]);

        const store = createStore();

        const bottom0 = store.get(molBottom);
        const bottom1 = store.get(molBottom, scope1);
        const bottom2 = store.get(molBottom, scope2);

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

      it("Works with a diamond pattern dependency tree, with side scope dependencies", () => {
        const molLeft = molecule((getMol, getScope) => [
          "left",
          getScope(LeftScope),
          getMol(molTop),
        ]);
        const molRight = molecule((getMol, getScope) => [
          "right",
          getScope(RightScope),
          getMol(molTop),
        ]);
        const molBottom = molecule((getMol, getScope) => [
          "bottom",
          getScope(BottomScope),
          getMol(molLeft),
          getMol(molRight),
        ]);

        const store = createStore();

        const bottom0 = store.get(molBottom);
        const bottom1 = store.get(
          molBottom,
          scope1,
          rightScope1,
          leftScope1,
          bottomScope1
        );
        const bottom2 = store.get(
          molBottom,
          scope2,
          rightScope2,
          leftScope2,
          bottomScope2
        );

        expect(
          // Second call to get should return the same value
          store.get(molBottom)
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
          store.get(molBottom, scope1, rightScope1, leftScope1, bottomScope1)
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
          store.get(molBottom, scope2, rightScope2, leftScope2, bottomScope2)
        ).toBe(bottom2);
        expect(bottom2).toStrictEqual([
          "bottom",
          "BS2",
          ["left", "LS2", ["top", 2]],
          ["right", "RS2", ["top", 2]],
        ]);
        expect(bottom2[2][2]).toBe(bottom2[3][2]);
      });

      it("Works with a diamond pattern dependency tree, with sibling dependency", () => {
        const molLeft = molecule((getMol) => ["left", getMol(molTop)]);
        const molRight = molecule((getMol) => [
          "right",
          getMol(molTop),
          getMol(molLeft),
        ]);

        const molBottom = molecule((getMol) => [
          "bottom",
          getMol(molLeft),
          getMol(molRight),
        ]);

        const store = createStore();

        const bottom0 = store.get(molBottom);
        const bottom1 = store.get(molBottom, scope1);
        const bottom2 = store.get(molBottom, scope2);

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

      it("Works with a diamond pattern dependency tree, with a direct deep dependency", () => {
        const molLeft = molecule((getMol) => ["left", getMol(molTop)]);
        const molRight = molecule((getMol) => ["right", getMol(molTop)]);
        const molBottom = molecule((getMol) => [
          "bottom",
          getMol(molTop),
          getMol(molLeft),
          getMol(molRight),
        ]);

        const store = createStore();

        const bottom0 = store.get(molBottom);
        const bottom1 = store.get(molBottom, scope1);
        const bottom2 = store.get(molBottom, scope2);

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

      it("Works with a deep diamond pattern dependency tree with a deep right tree", () => {
        const molLeft = molecule((getMol) => ["left", getMol(molTop)]);
        const molRight = molecule((getMol) => ["right", getMol(molTop)]);
        // Deep right tree
        const molRightLeft = molecule((getMol) => ["left", getMol(molRight)]);
        const molRightRight = molecule((getMol) => ["right", getMol(molRight)]);

        const molBottom = molecule((getMol) => [
          "bottom",
          getMol(molLeft),
          getMol(molRightLeft),
          getMol(molRightRight),
        ]);

        const store = createStore();

        const bottom0 = store.get(molBottom);
        const bottom1 = store.get(molBottom, scope1);
        const bottom2 = store.get(molBottom, scope2);

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
});
