import { PrimitiveScopeMap, ScopeTuple } from "../../vanilla";

/**
 * For values that are "primitive" (not an object),
 * deregisters them from the primitive scope
 * cache to ensure no memory leaks
 */

export function deregisterScopeTuple<T>(
  tuple: ScopeTuple<T>,
  primitiveScopeMap: PrimitiveScopeMap,
  id: Symbol
) {
  const [scope, value] = tuple;
  // No scope cleanup needed for non-primitives
  if (typeof value === "object") return;

  const scopeMap = primitiveScopeMap.get(scope);
  if (!scopeMap) return;

  const cached = scopeMap.get(value);
  if (!cached) return;

  cached.references.delete(id);

  if (cached.references.size <= 0) {
    scopeMap.delete(value);
  }
}
