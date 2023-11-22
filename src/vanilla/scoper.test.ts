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
