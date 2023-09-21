import { expectTypeOf, test } from "vitest";
import {
    ScopeProvider,
    createScope,
    molecule,
    useMolecule,
    type MoleculeScopeOptions,
} from "./";

import { MoleculeScopeOptions as LegacyMoleculeScopeOptions } from "./legacy/MoleculeScopeOptions";
import { ScopeProvider as LegacyScopeProvider } from "./legacy/ScopeProvider";
import { createScope as legacyCreateScope } from "./legacy/scope";
import { useMolecule as legacyUseMolecule } from "./legacy/useMolecule";

test("molecule", () => {
  // Molecules aren't fully backwards compatible.
  expectTypeOf(molecule).toBeFunction();
});

test("MoleculeScopeOptions", () => {
  expectTypeOf<MoleculeScopeOptions>().toMatchTypeOf<LegacyMoleculeScopeOptions>();
});

test("ScopeProvider", () => {
  expectTypeOf(ScopeProvider).toMatchTypeOf<typeof LegacyScopeProvider>();
});

test("createScope", () => {
  expectTypeOf(createScope).toMatchTypeOf<typeof legacyCreateScope>();
});

test("useMolecule", () => {
  expectTypeOf(useMolecule).toBeFunction();
  expectTypeOf(useMolecule).toMatchTypeOf<typeof legacyUseMolecule>();
});