import { LoggingInstrumentation } from "./internal/instrumentation";
import { createScoper } from "./scoper";
import { UserScope } from "./testing/test-molecules";

test("Caches a scope tuple", () => {
  const scoper = createScoper();
  const [[tuple1], unsub1] = scoper.useScopes([UserScope, "one@example.com"]);
  const [[tuple2], unsub2] = scoper.useScopes([UserScope, "one@example.com"]);
  expect(tuple1).toBe(tuple2);

  unsub1();
  unsub2();
});

test("Does not cache when scopes are cleaned up", () => {
  const scoper = createScoper();
  const [[tuple1], unsub1] = scoper.useScopes([UserScope, "one@example.com"]);
  unsub1();

  // Note: GC / cleanup happens in here

  const [[tuple2], unsub2] = scoper.useScopes([UserScope, "one@example.com"]);
  unsub2();
  // Subscription 1 and 2 never overlapped
  expect(tuple1).not.toBe(tuple2);
});

test("Caches if there are overlapping subscriptions", () => {
  const scoper = createScoper();
  const [[tuple1], unsub1] = scoper.useScopes([UserScope, "one@example.com"]);
  const [[tuple2], unsub2] = scoper.useScopes([UserScope, "one@example.com"]);
  unsub2();
  unsub1();
  // Subscription 2 overlapped with 1
  expect(tuple1).toBe(tuple2);
});

test("Caches as long as subscriptions overlap", () => {
  const scoper = createScoper();
  const [[tuple1], unsub1] = scoper.useScopes([UserScope, "one@example.com"]);

  const [[tuple2], unsub2] = scoper.useScopes([UserScope, "one@example.com"]);

  // Doesn't create a new value, the second use has a lease
  unsub1();

  const [[tuple3], unsub3] = scoper.useScopes([UserScope, "one@example.com"]);
  unsub2();

  const [[tuple4], unsub4] = scoper.useScopes([UserScope, "one@example.com"]);
  unsub3();

  // Final cleanup
  unsub4();

  expect(tuple1).toBe(tuple2);
  expect(tuple1).toBe(tuple3);
  expect(tuple1).toBe(tuple4);
});

test("Scope tuples match during creation and expansion", () => {
  const scoper = createScoper();

  const sub1 = scoper.createSubscription();

  const [tuple1] = sub1.expand([[UserScope, "one@example.com"]]);

  const [tuple2] = sub1.start();

  expect(tuple1).toBe(tuple2);
});

test("Can't register cleanups for unused scopes", () => {
  const scoper = createScoper();

  const sub1 = scoper.createSubscription();
  const [tuple1] = sub1.expand([[UserScope, "one@example.com"]]);

  const cleanupFn = vi.fn();

  expect(() =>
    scoper.registerCleanups(
      [[UserScope, "one@example.com"]],
      new Set([cleanupFn]),
    ),
  ).toThrowError();
});

test("Scope subscriptions can be re-used", () => {
  const scoper = createScoper();

  const sub1 = scoper.createSubscription();
  const [tuple1] = sub1.expand([[UserScope, "one@example.com"]]);

  const [tuple2] = sub1.start();
  const cleanupFn = vi.fn();

  scoper.registerCleanups(
    [[UserScope, "one@example.com"]],
    new Set([cleanupFn]),
  );

  expect(tuple1).toBe(tuple2);
  sub1.stop();

  expect(cleanupFn).toHaveBeenCalled();

  for (let iteration = 0; iteration < 10; iteration++) {
    const cleanupFnInner = vi.fn();

    const [tuple3] = sub1.start();
    scoper.registerCleanups(
      [[UserScope, "one@example.com"]],
      new Set([cleanupFnInner]),
    );
    expect(tuple1).toBe(tuple3);
    sub1.stop();
    expect(cleanupFnInner).toHaveBeenCalled();
    cleanupFnInner.mockReset();
  }
});

test("addCleanups method on subscription", () => {
  const scoper = createScoper();
  const subscription = scoper.createSubscription();
  const cleanupFn = vi.fn();

  // Expand and start the subscription to cache the scopes
  subscription.expand([[UserScope, "test@example.com"]]);
  subscription.start();

  // Add cleanups using the addCleanups method (now the scopes are cached)
  subscription.addCleanups(new Set([cleanupFn]));

  // Stop the subscription
  subscription.stop();

  // Cleanup should have been called
  expect(cleanupFn).toHaveBeenCalled();
});
