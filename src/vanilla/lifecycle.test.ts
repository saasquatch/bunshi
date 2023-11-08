import { vi } from "vitest";
import { createInjector } from "./injector";
import { AnyScopeTuple } from "./internal/internal-types";
import { mounted } from "./lifecycle";
import { molecule } from "./molecule";
import { createScope } from "./scope";

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

test("onCleanup", () => {
  const injector = createInjector();
  const mockFn = vi.fn();
  const scopeTuple: AnyScopeTuple = [ExampleScope, mockFn];

  const [value, unsub] = injector.use(ExampleCleanupMolecule, scopeTuple);

  expect(value).toBe(mockFn);

  expect(mockFn).toHaveBeenLastCalledWith("mounted");

  const [value2, unsub2] = injector.use(ExampleCleanupMolecule, scopeTuple);
  expect(value2).toBe(mockFn);

  expect(mockFn).toHaveBeenLastCalledWith("created");

  unsub2();
  unsub();
  expect(mockFn).toHaveBeenLastCalledWith("unmounted");
});
