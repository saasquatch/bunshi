import { createInjector } from "../injector";
import { molecule, moleculeInterface } from "../molecule";
import { createScope } from "../scope";
import {
  isInjector,
  isMolecule,
  isMoleculeInterface,
  isMoleculeScope,
} from "./utils";

describe("isMolecule", () => {
  it("accepts valid molecules", () => {
    expect(isMolecule(createInjector())).toBe(false);
    expect(isMolecule(moleculeInterface())).toBe(false);
    expect(isMolecule(createScope("test"))).toBe(false);

    expect(isMolecule(molecule(() => 1))).toBe(true);
  });

  it("rejects bad values", () => {
    testRejectBadValue(isMolecule);
  });
});

describe("isMoleculeScope", () => {
  it("accepts valid molecule scopes", () => {
    expect(isMoleculeScope(molecule(() => 1))).toBe(false);
    expect(isMoleculeScope(createInjector())).toBe(false);
    expect(isMoleculeScope(moleculeInterface())).toBe(false);

    expect(isMoleculeScope(createScope("test"))).toBe(true);
  });

  it("rejects bad values", () => {
    testRejectBadValue(isMoleculeScope);
  });
});

describe("isMoleculeInterface", () => {
  it("accepts valid molecule interfaces", () => {
    expect(isMoleculeInterface(molecule(() => 1))).toBe(false);
    expect(isMoleculeInterface(createScope("test"))).toBe(false);
    expect(isMoleculeInterface(createInjector())).toBe(false);

    expect(isMoleculeInterface(moleculeInterface())).toBe(true);
  });

  it("rejects bad values", () => {
    testRejectBadValue(isMoleculeInterface);
  });
});

describe("isInjector", () => {
  it("accepts valid injectors", () => {
    expect(isInjector(molecule(() => 1))).toBe(false);
    expect(isInjector(createScope("test"))).toBe(false);
    expect(isInjector(moleculeInterface())).toBe(false);

    expect(isInjector(createInjector())).toBe(true);
  });

  it("rejects bad values", () => {
    testRejectBadValue(isInjector);
  });
});

function testRejectBadValue(fn: (value: any) => boolean) {
  expect(fn(null)).toBe(false);
  expect(fn(undefined)).toBe(false);
  expect(fn({})).toBe(false);
  expect(fn(0)).toBe(false);
  expect(fn(-1)).toBe(false);
  expect(fn(1)).toBe(false);
  expect(fn(1.12)).toBe(false);
  expect(fn(-3.14)).toBe(false);
  expect(fn(new Set())).toBe(false);
  expect(fn(new Map())).toBe(false);
  expect(fn(new WeakSet())).toBe(false);
  expect(fn(new WeakMap())).toBe(false);
  expect(fn(NaN)).toBe(false);
  expect(fn(true)).toBe(false);
  expect(fn(false)).toBe(false);
  expect(fn("string")).toBe(false);
  expect(fn(Symbol())).toBe(false);
  expect(fn(Symbol.for("test"))).toBe(false);

  class TestClass {}
  expect(fn(TestClass)).toBe(false);

  function TestFunction() {}
  expect(fn(TestFunction)).toBe(false);

  const target = {
    message1: "hello",
    message2: "everyone",
  };

  const handler1 = {};

  const proxy1 = new Proxy(target, handler1);

  expect(fn(proxy1)).toBe(false);
}
