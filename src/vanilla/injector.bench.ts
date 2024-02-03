import { bench } from "vitest";
import { createInjector, molecule } from ".";
import { createDeepMolecule } from "../shared/testing/deepMolecule";
import { AnyMolecule } from "./internal/internal-types";

describe("Injector benchmarks", () => {
  const SimpleMolecule = molecule(() => {
    return Math.random();
  });

  let injector = createInjector();
  beforeEach(() => {
    injector = createInjector();
  });

  bench("Using a constant molecule", () => {
    const [value, unsub] = injector.use(SimpleMolecule);
    unsub();
  });

  bench("Using a new molecule", () => {
    const TransientMolecule = molecule(() => {
      return Math.random();
    });
    const [value, unsub] = injector.use(TransientMolecule);
    unsub();
  });

  const DeepMolecule1 = createDeepMolecule({
    rootDependency: SimpleMolecule,
    depth: 100,
  });

  bench("Using a really deep molecule, without unsubscribing", () => {
    const [value, unsub] = injector.use(DeepMolecule1);
  });

  const DeepMolecule2 = createDeepMolecule({
    rootDependency: SimpleMolecule,
    depth: 100,
  });
  bench("Using a really deep molecule, with proper cleanup", () => {
    const [value, unsub] = injector.use(DeepMolecule2);
    unsub();
  });

  let DeepMolecule3: AnyMolecule;
  bench(
    "Using a new really deep molecule, with proper cleanup",
    () => {
      const [value, unsub] = injector.use(DeepMolecule2);
      unsub();
    },
    {
      setup() {
        DeepMolecule3 = createDeepMolecule({
          rootDependency: SimpleMolecule,
          depth: 100,
        });
      },
    },
  );
});

describe("Baseline benchmarks", () => {
  bench("No-op", () => {
    1 + 1;
  });
  bench("Create an 100 element array", () => {
    // Do nothing
    Array.from({ length: 100 });
  });
});
