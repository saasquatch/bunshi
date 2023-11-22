import type { ArgumentsType } from "vitest";
import { ComponentScope, createScope, useScopes, type ScopeTuple } from ".";
import { ScopeSymbol } from "./internal/symbols";
import { withSetup } from "./testing/test-utils";

const PrimitiveScope = createScope<string>("primitive");
const ObjectScope = createScope<Set<unknown>>(new Set());
const UniqueScope = createScope<unknown>(new Error("Do not use"));

const useTestScopes = (...args: ArgumentsType<typeof useScopes>) =>
  useScopes(...args).filter(([scope]) => scope !== ComponentScope);

describe("Providing values ", () => {
  test("Returns empty array by default", () => {
    const [result, mount, app] = withSetup(() => useTestScopes());

    mount();

    expect(result.value).toStrictEqual([]);

    app.unmount();
  });
  test("useScopes will pass along the provided value", () => {
    const [result, mount, app] = withSetup(() => useTestScopes());

    const scopes = [[PrimitiveScope, "foo"]];
    // mock provide for testing injections
    app.provide(ScopeSymbol, scopes);

    mount();

    // Object equality -- should be the exact scope tuples
    expect(result.value).toStrictEqual(scopes);

    app.unmount();
  });

  describe("Exclusive scopes", () => {
    const tuple: ScopeTuple<string> = [PrimitiveScope, "foo"];

    test("Exclusive scopes provides that value", () => {
      const [result, mount, app] = withSetup(() =>
        useTestScopes({ exclusiveScope: tuple }),
      );

      mount();

      expect(result.value).toStrictEqual([tuple]);
      const [tuple1] = result.value!;
      expect(tuple1).toStrictEqual(tuple);

      app.unmount();
    });

    test("Exclusive scopes overrides context", () => {
      const [result, mount, app] = withSetup(() =>
        useTestScopes({ exclusiveScope: tuple }),
      );

      app.provide(ScopeSymbol, [[PrimitiveScope, "implicit"]]);
      mount();

      expect(result.value).toStrictEqual([tuple]);
      const [tuple1] = result.value!;
      expect(tuple1).toStrictEqual(tuple);

      app.unmount();
    });

    test("Exclusive scopes overrides all scopes, even when they are not related", () => {
      const [result, mount, app] = withSetup(() =>
        useTestScopes({ exclusiveScope: tuple }),
      );

      app.provide(ScopeSymbol, [[ObjectScope, new Set()]]);
      mount();

      expect(result.value).toStrictEqual([tuple]);
      const [tuple1] = result.value!;
      expect(tuple1).toStrictEqual(tuple);

      app.unmount();
    });
  });

  describe("With scopes", () => {
    const tuple: ScopeTuple<string> = [PrimitiveScope, "explicit"];

    test("With scopes provides that value", () => {
      const [result, mount, app] = withSetup(() =>
        useTestScopes({ withScope: tuple }),
      );

      mount();

      expect(result.value).toStrictEqual([tuple]);
      const [tuple1] = result.value!;
      expect(tuple1).toStrictEqual(tuple);

      app.unmount();
    });

    test("With scopes overrides context for matching scope", () => {
      const [result, mount, app] = withSetup(() =>
        useTestScopes({ withScope: tuple }),
      );

      app.provide(ScopeSymbol, [[PrimitiveScope, "implicit"]]);
      mount();

      expect(result.value).toStrictEqual([tuple]);
      const [tuple1] = result.value!;
      expect(tuple1).toStrictEqual(tuple);

      app.unmount();
    });

    test("With scopes overrides context for only the matching matching scope", () => {
      const [result, mount, app] = withSetup(() =>
        useTestScopes({ withScope: [PrimitiveScope, "explicit"] }),
      );

      app.provide(ScopeSymbol, [[ObjectScope, new Set()]]);
      mount();

      expect(result.value).toStrictEqual([
        [ObjectScope, new Set()],
        [PrimitiveScope, "explicit"],
      ]);

      app.unmount();
    });
  });

  describe("Unique scopes", () => {
    test("Unique scopes provides that value", () => {
      const [result, mount, app] = withSetup(() =>
        useTestScopes({ withUniqueScope: UniqueScope }),
      );

      mount();

      expect(result.value).toStrictEqual([
        [
          UniqueScope,
          new Error("Don't use this value, it is a placeholder only"),
        ],
      ]);

      app.unmount();
    });

    test("With scopes overrides context for matching scope", () => {
      const [result, mount, app] = withSetup(() =>
        useTestScopes({ withUniqueScope: UniqueScope }),
      );

      app.provide(ScopeSymbol, [[UniqueScope, "implicit"]]);
      mount();

      expect(result.value).toStrictEqual([
        [
          UniqueScope,
          new Error("Don't use this value, it is a placeholder only"),
        ],
      ]);

      app.unmount();
    });

    test("With scopes overrides context for only the matching matching scope", () => {
      const [result, mount, app] = withSetup(() =>
        useTestScopes({ withUniqueScope: UniqueScope }),
      );

      app.provide(ScopeSymbol, [[ObjectScope, new Set()]]);
      mount();

      expect(result.value).toStrictEqual([
        [ObjectScope, new Set()],
        [
          UniqueScope,
          new Error("Don't use this value, it is a placeholder only"),
        ],
      ]);

      app.unmount();
    });
  });
});
