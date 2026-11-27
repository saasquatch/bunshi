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

  test("Using a constant molecule", async ({ bench }) => {
    await bench("Using a constant molecule", () => {
      const [, unsub] = injector.use(SimpleMolecule);
      unsub();
    }).run();
  });

  test("Using a new molecule", async ({ bench }) => {
    await bench("Using a new molecule", () => {
      const TransientMolecule = molecule(() => {
        return Math.random();
      });
      const [, unsub] = injector.use(TransientMolecule);
      unsub();
    }).run();
  });

  const DeepMolecule1 = createDeepMolecule({
    rootDependency: SimpleMolecule,
    depth: 100,
  });

  test("Using a really deep molecule, without unsubscribing", async ({
    bench,
  }) => {
    await bench("Using a really deep molecule, without unsubscribing", () => {
      injector.use(DeepMolecule1);
    }).run();
  });

  const DeepMolecule2 = createDeepMolecule({
    rootDependency: SimpleMolecule,
    depth: 100,
  });

  test("Using a really deep molecule, with proper cleanup", async ({
    bench,
  }) => {
    await bench("Using a really deep molecule, with proper cleanup", () => {
      const [, unsub] = injector.use(DeepMolecule2);
      unsub();
    }).run();
  });

  test("Using a new really deep molecule, with proper cleanup", async ({
    bench,
  }) => {
    let DeepMolecule3: AnyMolecule;
    await bench(
      "Using a new really deep molecule, with proper cleanup",
      {
        beforeAll() {
          DeepMolecule3 = createDeepMolecule({
            rootDependency: SimpleMolecule,
            depth: 100,
          });
        },
      },
      () => {
        const [, unsub] = injector.use(DeepMolecule3);
        unsub();
      },
    ).run();
  });
});

test("Baseline benchmarks", async ({ bench }) => {
  await bench.compare(
    bench("No-op", () => {
      1 + 1;
    }),
    bench("Create an 100 element array", () => {
      Array.from({ length: 100 });
    }),
  );
});
