/**
 * A weak, deep cache
 *
 *
 * Copied direcly from: https://github.com/pmndrs/jotai/blob/main/src/utils/weakCache.ts
 *
 * Eventually just import it from Jotai if it's exported.
 *
 *
 *
 */
export type WeakCache<TKey extends {}, TValue> = WeakMap<
  TKey,
  [WeakCache<TKey, TValue>] | [WeakCache<TKey, TValue>, TValue]
>;

const getWeakCacheItem = <TKey extends {}, TValue>(
  cache: WeakCache<TKey, TValue>,
  deps: Deps<TKey>
): TValue | undefined => {
  while (true) {
    const [dep, ...rest] = deps;
    const entry = cache.get(dep);
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

const setWeakCacheItem = <TKey extends {}, TValue>(
  cache: WeakCache<TKey, TValue>,
  deps: Deps<TKey>,
  item: TValue
): void => {
  while (true) {
    const [dep, ...rest] = deps;
    let entry = cache.get(dep);
    if (!entry) {
      entry = [new WeakMap()];
      cache.set(dep, entry);
    }
    if (!rest.length) {
      entry[1] = item;
      return;
    }
    cache = entry[0];
    deps = rest;
  }
};

type Deps<T> = readonly T[];

export type DeepCache<TKey extends {}, TValue> = {
  /**
   * The raw deep cache
   */
  cache: WeakCache<TKey, TValue>;

  /**
   * Get or create an item in the cache
   *
   * If an item is in the cache, then returns that item.
   *
   * If an item is not in the cache, then creates a new value from
   * the provided callback.
   *
   * Uses the list of dependecies, in order, to cache the item.
   *
   * @param createFn
   * @param deps
   */
  deepCache(createFn: () => TValue, foundFn:()=>void, deps: Deps<TKey>): TValue;

  /**
   * Create or update an item in the cache
   *
   * If the cache is empty, then a new item is created.
   *
   * If the cache has an item, then use the callback function to update it.
   *
   * @param createFn
   * @param deps
   */
  upsert(
    createFn: (previous: TValue | undefined) => TValue,
    deps: Deps<TKey>
  ): void;
};

export const createDeepCache = <TKey extends {}, TValue>(): DeepCache<
  TKey,
  TValue
> => {
  let cache: WeakCache<TKey, TValue> = new WeakMap();
  const deepCache = (createFn: () => TValue, foundFn: ()=>void, deps: Deps<TKey>) => {
    if(!deps.length) throw new Error("Dependencies need to exist.");
    const cachedAtom = getWeakCacheItem(cache, deps);
    if (cachedAtom) {
      foundFn();
      return cachedAtom!;
    }
    const newObject = createFn();
    setWeakCacheItem(cache, deps, newObject);
    return newObject;
  };
  const upsert = (
    createFn: (previous: TValue | undefined) => TValue,
    deps: Deps<TKey>
  ) => {
    if(!deps.length) throw new Error("Dependencies need to exist.");
    const cachedAtom = getWeakCacheItem(cache, deps);
    const newObject = createFn(cachedAtom);
    setWeakCacheItem(cache, deps, newObject);
  };

  return {
    cache,
    deepCache,
    upsert,
  };
};
