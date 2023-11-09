import { vi } from "vitest";
import { createInjector } from "./injector";
import { AnyScopeTuple } from "./internal/internal-types";
import { mounted } from "./lifecycle";
import { molecule } from "./molecule";
import { createScope } from "./scope";

test("Scoped molecules are mounted and cleaned up", () => {
  const ExampleScope = createScope<Function>(() => {});

  const ExampleCleanupMolecule = molecule((mol, scope) => {
    const testFn = scope(ExampleScope);

    mounted(() => {
      testFn("mounted");
      return () => testFn("unmounted");
    });
    testFn("created");
    return testFn;
  });

  const injector = createInjector();
  const mockFn = vi.fn();
  const scopeTuple: AnyScopeTuple = [ExampleScope, mockFn];

  const [value, unsub] = injector.use(ExampleCleanupMolecule, scopeTuple);
  expect(value).toBe(mockFn);

  const [value2, unsub2] = injector.use(ExampleCleanupMolecule, scopeTuple);
  expect(value2).toBe(mockFn);

  unsub2();
  unsub();

  expect(mockFn).toHaveBeenNthCalledWith(1, "created");
  expect(mockFn).toHaveBeenNthCalledWith(2, "mounted");
  expect(mockFn).toHaveBeenNthCalledWith(3, "created");
  expect(mockFn).toHaveBeenNthCalledWith(4, "unmounted");
});

test("Can't use `mounted` hook in globally scoped molecule", () => {
  const testFn = vi.fn();

  const ExampleCleanupMolecule = molecule(() => {
    mounted(() => {
      testFn("mounted");
      return () => testFn("unmounted");
    });
    testFn("created");
    return testFn;
  });

  const injector = createInjector();

  expect(() => injector.get(ExampleCleanupMolecule)).toThrowError();
});
