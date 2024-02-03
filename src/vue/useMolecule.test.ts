import { resetDefaultInjector } from "../vanilla/getDefaultInjector";
import { CountMolecule, lifecycle, userScope } from "./testing/CountMolecule";
import { createProvider } from "./testing/ScopeProvider";
import { wrap } from "./testing/test-utils";
import { useMolecule } from "./useMolecule";

beforeEach(() => {
  /**
   * Prevents default scopes getting cached for too long
   */
  resetDefaultInjector();
});

describe.each([
  { userId: "one@example.com", case: "Regular email" },
  { userId: "two@example.com", case: "Different email" },
  { userId: "", case: "Empty string" },
  { userId: " ", case: "White space" },
  { userId: userScope.defaultValue, case: "Default value" },
])("Two branches, one molecule value. $case", ({ userId }) => {
  const Wrapper = createProvider([userScope, userId]);
  test("Same component", () => {
    const counter = wrap(() => useMolecule(CountMolecule), { Wrapper });

    lifecycle.expectUncalled();
    const [result1, rendered1] = counter.render();

    expect(result1.value?.username).toBe(userId);
    lifecycle.expectActivelyMounted();

    const [result2, rendered2] = counter.render();
    expect(result2.value?.username).toBe(userId);

    rendered1.unmount();

    lifecycle.expectActivelyMounted();
    rendered2.unmount();

    lifecycle.expectToMatchCalls([userId]);
  });
  test("Different components", () => {
    const counter1 = wrap(() => useMolecule(CountMolecule), {
      Wrapper: createProvider([userScope, userId]),
    });
    const counter2 = wrap(() => useMolecule(CountMolecule), {
      Wrapper: createProvider([userScope, userId]),
    });

    lifecycle.expectUncalled();
    const [result1, rendered1] = counter1.render();

    expect(result1.value?.username).toBe(userId);
    lifecycle.expectActivelyMounted();

    const [result2, rendered2] = counter2.render();
    expect(result2.value?.username).toBe(userId);

    rendered1.unmount();

    lifecycle.expectActivelyMounted();
    rendered2.unmount();

    lifecycle.expectToMatchCalls([userId]);
  });
});

test.each([
  {
    userId1: "one@example.com",
    userId2: "two@example.com",
    case: "Different emails",
  },
  { userId1: "a", userId2: "A", case: "Case sensitive" },
  { userId1: "a", userId2: "", case: "Empty strings" },
  { userId1: "  ", userId2: " ", case: "White space" },
  {
    userId1: userScope.defaultValue,
    userId2: "two",
    case: "Default value is first",
  },
  {
    userId1: "one",
    userId2: userScope.defaultValue,
    case: "Default value is second",
  },
])(
  "Two molecule values for different scopes. $case",
  ({ userId1, userId2 }) => {
    const counter1 = wrap(
      () => {
        return useMolecule(CountMolecule);
      },
      {
        Wrapper: createProvider([userScope, userId1]),
      },
    );

    const counter2 = wrap(
      () => {
        return useMolecule(CountMolecule);
      },
      {
        Wrapper: createProvider([userScope, userId2]),
      },
    );

    lifecycle.expectUncalled();
    const [result1, rendered1] = counter1.render();

    expect(result1.value?.username).toBe(userId1);
    lifecycle.expectActivelyMounted();

    const [result2, rendered2] = counter2.render();
    expect(result2.value?.username).toBe(userId2);

    expect(lifecycle.unmounts).not.toHaveBeenCalled();
    rendered1.unmount();
    rendered2.unmount();

    lifecycle.expectToMatchCalls([userId1], [userId2]);
  },
);

test("Default scope cleanup", () => {
  const counter1 = wrap(() => useMolecule(CountMolecule));
  const counter2 = wrap(() => useMolecule(CountMolecule));

  lifecycle.expectUncalled();
  const [result1, rendered1] = counter1.render();

  expect(result1.value?.username).toBe(userScope.defaultValue);
  lifecycle.expectActivelyMounted();

  const [result2, rendered2] = counter2.render();
  expect(result2.value?.username).toBe(userScope.defaultValue);

  expect(lifecycle.unmounts).not.toHaveBeenCalled();
  rendered1.unmount();
  rendered2.unmount();
  expect(lifecycle.unmounts).toHaveBeenCalled();

  lifecycle.expectToMatchCalls([userScope.defaultValue]);
});
