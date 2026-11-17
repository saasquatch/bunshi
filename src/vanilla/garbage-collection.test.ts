/* eslint-disable compat/compat */
import { setFlagsFromString } from "node:v8";
import { runInNewContext } from "node:vm";
import { createInjector } from "./injector";
import { onUnmount } from "./lifecycle";
import { molecule } from "./molecule";
import { createScope } from "./scope";

/**
 * Node-only: these tests need to force garbage collection, so they are
 * excluded from the browser test suite.
 */
setFlagsFromString("--expose-gc");
const gc: () => void = runInNewContext("gc");

const PageScope = createScope("none");
const GlobalMolecule = molecule(() => ({ global: true }));
const PageMolecule = molecule((mol, scope) => {
  scope(PageScope);
  mol(GlobalMolecule);
  return { page: true };
});

const VISITS = 10;

test("Released molecules are garbage collected while a global molecule they use is still in use", async () => {
  const injector = createInjector();
  const [, releaseGlobal] = injector.use(GlobalMolecule);

  const pages = Array.from({ length: VISITS }, (_, i) =>
    visit(injector, `page-${i}`),
  );
  await collectGarbage();

  expect(pages.filter(isAlive)).toHaveLength(0);

  releaseGlobal();
});

test("Released molecules are garbage collected once the global molecule they use is released", async () => {
  const injector = createInjector();
  const [, releaseGlobal] = injector.use(GlobalMolecule);

  const pages = Array.from({ length: VISITS }, (_, i) =>
    visit(injector, `page-${i}`),
  );
  releaseGlobal();
  await collectGarbage();

  expect(pages.filter(isAlive)).toHaveLength(0);
});

test("A released molecule is garbage collected when one of its unmount callbacks throws", async () => {
  const injector = createInjector();

  const page = visitThrowingPage(injector);
  await collectGarbage();

  expect(isAlive(page)).toBe(false);
});

/**
 * Module-level, so it outlives every molecule that registers it.
 */
function throwOnUnmount() {
  throw new Error("unmount failed");
}

const ThrowingPageMolecule = molecule((_, scope) => {
  scope(PageScope);
  const value = { unmounted: false };
  onUnmount(() => {
    value.unmounted = true;
  });
  onUnmount(throwOnUnmount);
  return value;
});

function visitThrowingPage(
  injector: ReturnType<typeof createInjector>,
): WeakRef<object> {
  const [page, release] = injector.use(ThrowingPageMolecule, [
    PageScope,
    "throwing-page",
  ]);
  expect(release).toThrow("unmount failed");
  return new WeakRef(page);
}

test("A molecule dropped without unsubscribing is garbage collected when it registers a long-lived unmount callback", async () => {
  const injector = createInjector();

  const dropped = useAndDrop(injector);
  await collectGarbage();

  expect(isAlive(dropped)).toBe(false);
});

/**
 * Module-level, so it outlives every molecule that registers it.
 */
function sharedOnUnmount() {}

function useAndDrop(
  injector: ReturnType<typeof createInjector>,
): WeakRef<object> {
  const TemporaryScope = createScope({});
  const TemporaryMolecule = molecule((_, scope) => {
    scope(TemporaryScope);
    onUnmount(sharedOnUnmount);
    return { temporary: true };
  });
  const [value] = injector.use(TemporaryMolecule, [TemporaryScope, {}]);
  return new WeakRef(value);
}

function visit(
  injector: ReturnType<typeof createInjector>,
  id: string,
): WeakRef<object> {
  const [page, release] = injector.use(PageMolecule, [PageScope, id]);
  release();
  return new WeakRef(page);
}

function isAlive(ref: WeakRef<object>): boolean {
  return ref.deref() !== undefined;
}

/**
 * A `WeakRef` keeps its target alive until the end of the job that created
 * it, so collection waits for later macrotasks.
 */
async function collectGarbage() {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    gc();
  }
}
