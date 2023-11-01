import { ComponentScope as VanillaComponentScope } from "../dist/vanilla.js";
import { ComponentScope as VanillaComponentScopeMjs } from "../dist/vanilla.mjs";

import { ComponentScope as ReactComponentScope } from "../dist/react.js";
import { ComponentScope as ReactComponentScopeMjs } from "../dist/react.mjs";

import { ComponentScope as VueComponentScope } from "../dist/vue.js";
import { ComponentScope as VueComponentScopeMjs } from "../dist/vue.mjs";

import { createScope as VanillaCreateScope } from "../dist/vanilla.js";
import { createScope as VanillaCreateScopeMjs } from "../dist/vanilla.mjs";

import { createScope as ReactCreateScope } from "../dist/react.js";
import { createScope as ReactCreateScopeMjs } from "../dist/react.mjs";

import { createScope as VueCreateScope } from "../dist/vue.js";
import { createScope as VueCreateScopeMjs } from "../dist/vue.mjs";

import { molecule as VanillaMolecule } from "../dist/vanilla.js";
import { molecule as VanillaMoleculeMjs } from "../dist/vanilla.mjs";

import { molecule as ReactMolecule } from "../dist/react.js";
import { molecule as ReactMoleculeMjs } from "../dist/react.mjs";

import { molecule as VueMolecule } from "../dist/vue.js";
import { molecule as VueMoleculeMjs } from "../dist/vue.mjs";

/**
 *
 * LANDMINE: This requires build to have run first!!
 *
 */
describe("Build artifacts", () => {
  describe("Vue bundle", () => {
    test("Exports are the same in CommonJS", () => {
      expect(VueMolecule).toBe(VanillaMolecule);
      expect(VueCreateScope).toBe(VanillaCreateScope);
      // Test of the fix for https://github.com/saasquatch/bunshi/issues/29
      expect(VueComponentScope).toBe(VanillaComponentScope);
    });

    test("Exports are the same in MJS", () => {
      expect(VueMoleculeMjs).toBe(VanillaMoleculeMjs);
      expect(VueCreateScopeMjs).toBe(VanillaCreateScopeMjs);
      // Test of the fix for https://github.com/saasquatch/bunshi/issues/29
      expect(VueComponentScopeMjs).toBe(VanillaComponentScopeMjs);
    });
  });

  describe("React bundle", () => {
    test("Exports are the same in CommonJS for React", () => {
      expect(ReactMolecule).toBe(VanillaMolecule);
      expect(ReactCreateScope).toBe(VanillaCreateScope);
      // Test of the fix for https://github.com/saasquatch/bunshi/issues/29
      expect(ReactComponentScope).toBe(VanillaComponentScope);
    });

    test("Exports are the same in MJS", () => {
      expect(ReactMoleculeMjs).toBe(VanillaMoleculeMjs);
      expect(ReactCreateScopeMjs).toBe(VanillaCreateScopeMjs);
      // Test of the fix for https://github.com/saasquatch/bunshi/issues/29
      expect(ReactComponentScopeMjs).toBe(VanillaComponentScopeMjs);
    });
  });
});
