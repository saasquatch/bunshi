import { molecule, use } from ".";
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

test("Peer subscriptions can share molecules", () => {
  const Direct = molecule(() => use(UserScope));
  const Indirect = molecule(() => use(Direct));

  const scoper = createScoper();

  const sub1 = scoper.createSubscription();
  const sub1Prestart = sub1.expand([[UserScope, "bob"]]);

  const sub2 = scoper.createSubscription();
  const sub2Prestart = sub2.expand([[UserScope, "bob"]]);

  expect(sub1Prestart[0]).toStrictEqual([UserScope, "bob"]);
  expect(sub2Prestart[0]).toStrictEqual([UserScope, "bob"]);

  // Before subscription start, these tuples are hanging out as separate instances
  // Until the subscriptions are started, they dont converge
  expect(sub1Prestart[0]).not.toBe(sub2Prestart[0]);

  expect(sub1Prestart).not.toBe(sub2Prestart);

  const tuples1 = sub1.start();
  const tuples2 = sub2.start();

  expect(tuples1[0]).toStrictEqual([UserScope, "bob"]);
  expect(tuples2[0]).toStrictEqual([UserScope, "bob"]);

  // Should be the same exact value for the scope tuple
  // Since the subscription is started, the scope tuple can be cached and shared
  expect(tuples1[0]).toBe(tuples2[0]);

  // But not the same for the set of tuples
  expect(tuples1).not.toBe(tuples2);

  sub1.stop();
  sub2.stop();
});
