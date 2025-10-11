import type { ScopeTuple } from "../vanilla/types";

/**
 * Get a set of downstream scopes
 *
 *
 * @param p - Parent scopes
 * @param n - New scope tuple
 */
export function dstream(p: ScopeTuple<unknown>[], n: ScopeTuple<unknown>) {
  const [k] = n;
  const f = p.findIndex((s) => s[0] === k);

  const ds =
    f >= 0
      ? // Replace inline (when found)
        [...p.slice(0, f), n, ...p.slice(f + 1)]
      : // Append to the end (when not found)
        [...p, n];
  return ds;
}
