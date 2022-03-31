/**
 *
 *
 * Copied direcly from: https://github.com/pmndrs/jotai/blob/main/src/utils/weakCache.ts
 *
 * Eventually just import it from Jotai if it's exported.
 *
 *
 *
 */
export type WeakCache<T> = WeakMap<object, [WeakCache<T>] | [WeakCache<T>, T]>;

const getWeakCacheItem = <T>(
  cache: WeakCache<T>,
  deps: readonly object[]
): T | undefined => {
  while (true) {
    const [dep, ...rest] = deps;
    const entry = cache.get(dep as object);
    if (!entry) {
      return;
    }
    if (!rest.length) {
      return entry[1];
    }
    cache = entry[0];
    deps = rest;
  }
};

const setWeakCacheItem = <T>(
  cache: WeakCache<T>,
  deps: readonly object[],
  item: T
): void => {
  while (true) {
    const [dep, ...rest] = deps;
    let entry = cache.get(dep as object);
    if (!entry) {
      entry = [new WeakMap()];
      cache.set(dep as object, entry);
    }
    if (!rest.length) {
      entry[1] = item;
      return;
    }
    cache = entry[0];
    deps = rest;
  }
};

export const createMemoizeAtom = () => {
  const cache: WeakCache<{}> = new WeakMap();
  const memoizeAtom = <T extends {}, Deps extends readonly object[]>(
    createAtom: () => T,
    deps: Deps
  ) => {
    const cachedAtom = getWeakCacheItem(cache, deps);
    if (cachedAtom) {
      return cachedAtom as T;
    }
    const createdAtom = createAtom();
    setWeakCacheItem(cache, deps, createdAtom);
    return createdAtom;
  };
  return memoizeAtom;
};
