/**
 * Track a unique identifier for an object to use in debugging
 *
 * @param t
 */
export function trackInstanceId(t: unknown) {
  if (isValidCacheKey(t)) {
    instanceIds.set(t as {}, Symbol(`bunshi.instance ${instCount++}`));
  }
}

/**
 * Find the unique instance ID used for debugging
 *
 * @param t
 * @returns
 */
export function getInstanceId(t: unknown) {
  return instanceIds.get(t as any) ?? t;
}

let instCount = 0;
const instanceIds = new WeakMap<{}, symbol>();
function isValidCacheKey(t: unknown): boolean {
  if (typeof t === "object") return true;
  if (typeof t === "symbol") {
    // check for global symbols
    return Symbol.keyFor !== undefined;
  }
  if (typeof t === "function") return true;
  return false;
}
