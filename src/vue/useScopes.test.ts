import type { ArgumentsType } from "vitest";
import { ComponentScope, createScope, useScopes, type ScopeTuple } from ".";
import { ScopeSymbol } from "./internal/symbols";
import { wrap } from "./testing/test-utils";

const PrimitiveScope = createScope<string>("primitive");
const ObjectScope = createScope<Set<unknown>>(new Set());
const UniqueScope = createScope<unknown>(new Error("Do not use"));

const useTestScopes = (...args: ArgumentsType<typeof useScopes>) =>
  useScopes(...args).filter(([scope]) => scope !== ComponentScope);

const comp = wrap(() => useTestScopes());

describe("Providing values ", () => {
  test("Returns empty array by default", () => {
    const [result, rendered] = comp.render();

    expect(result.value).toStrictEqual([]);

    rendered.unmount();
  });
  test("useScopes will pass along the provided value", () => {
    const scopes = [[PrimitiveScope, "foo"]];

    const [result, rendered] = comp.render({
      global: {
        provide: {
          [ScopeSymbol]: scopes,
        },
      },
    });

    // Object equality -- should be the exact scope tuples
    expect(result.value).toStrictEqual(scopes);

    rendered.unmount();
  });

  describe("Exclusive scopes", () => {
    const tuple: ScopeTuple<string> = [PrimitiveScope, "foo"];

    test("Exclusive scopes provides that value", () => {
      const [result, rendered] = wrap(() =>
        useTestScopes({ exclusiveScope: tuple }),
      ).render();

      expect(result.value).toStrictEqual([tuple]);
      const [tuple1] = result.value!;
      expect(tuple1).toStrictEqual(tuple);

      rendered.unmount();
    });

    test("Exclusive scopes overrides context", () => {
      const [result, rendered] = wrap(() =>
        useTestScopes({ exclusiveScope: tuple }),
      ).render({
        global: {
          provide: {
            [ScopeSymbol]: [[PrimitiveScope, "implicit"]],
          },
        },
      });

      expect(result.value).toStrictEqual([tuple]);
      const [tuple1] = result.value!;
      expect(tuple1).toStrictEqual(tuple);

      rendered.unmount();
    });

    test("Exclusive scopes overrides all scopes, even when they are not related", () => {
      const [result, rendered] = wrap(() =>
        useTestScopes({ exclusiveScope: tuple }),
      ).render({
        global: {
          provide: {
            [ScopeSymbol]: [[ObjectScope, new Set()]],
          },
        },
      });

      expect(result.value).toStrictEqual([tuple]);
      const [tuple1] = result.value!;
      expect(tuple1).toStrictEqual(tuple);

      rendered.unmount();
    });
  });

  describe("With scopes", () => {
    const tuple: ScopeTuple<string> = [PrimitiveScope, "explicit"];

    test("With scopes provides that value", () => {
      const [result, rendered] = wrap(() =>
        useTestScopes({ withScope: tuple }),
      ).render();

      expect(result.value).toStrictEqual([tuple]);
      const [tuple1] = result.value!;
      expect(tuple1).toStrictEqual(tuple);

      rendered.unmount();
    });

    test("With scopes overrides context for matching scope", () => {
      const [result, rendered] = wrap(() =>
        useTestScopes({ withScope: tuple }),
      ).render({
        global: {
          provide: {
            [ScopeSymbol]: [[PrimitiveScope, "implicit"]],
          },
        },
      });

      expect(result.value).toStrictEqual([tuple]);
      const [tuple1] = result.value!;
      expect(tuple1).toStrictEqual(tuple);

      rendered.unmount();
    });

    test("With scopes overrides context for only the matching matching scope", () => {
      const [result, rendered] = wrap(() =>
        useTestScopes({ withScope: [PrimitiveScope, "explicit"] }),
      ).render({
        global: {
          provide: {
            [ScopeSymbol]: [[ObjectScope, new Set()]],
          },
        },
      });

      expect(result.value).toStrictEqual([
        [ObjectScope, new Set()],
        [PrimitiveScope, "explicit"],
      ]);

      rendered.unmount();
    });
  });

  describe("Unique scopes", () => {
    test("Unique scopes provides that value", () => {
      const [result, rendered] = wrap(() =>
        useTestScopes({ withUniqueScope: UniqueScope }),
      ).render();

      expect(result.value).toStrictEqual([
        [
          UniqueScope,
          new Error("Don't use this value, it is a placeholder only"),
        ],
      ]);

      rendered.unmount();
    });

    test("With scopes overrides context for matching scope", () => {
      const [result, rendered] = wrap(() =>
        useTestScopes({ withUniqueScope: UniqueScope }),
      ).render({
        global: {
          provide: {
            [ScopeSymbol]: [[UniqueScope, "implicit"]],
          },
        },
      });
      expect(result.value).toStrictEqual([
        [
          UniqueScope,
          new Error("Don't use this value, it is a placeholder only"),
        ],
      ]);

      rendered.unmount();
    });

    test("With scopes overrides context for only the matching matching scope", () => {
      const [result, rendered] = wrap(() =>
        useTestScopes({ withUniqueScope: UniqueScope }),
      ).render({
        global: {
          provide: {
            [ScopeSymbol]: [[ObjectScope, new Set()]],
          },
        },
      });

      expect(result.value).toStrictEqual([
        [ObjectScope, new Set()],
        [
          UniqueScope,
          new Error("Don't use this value, it is a placeholder only"),
        ],
      ]);

      rendered.unmount();
    });
  });
});
