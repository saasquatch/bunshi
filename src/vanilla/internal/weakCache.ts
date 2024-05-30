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
  deps: Deps<TKey>,
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
  item: TValue,
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
  remove(...deps: TKey[]): void;

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
  deepCache(
    createFn: () => TValue,
    foundFn: (found: TValue) => void,
    deps: Deps<TKey>,
  ): TValue;

  get(deps: Deps<TKey>): TValue | undefined;
  set(deps: Deps<TKey>, value: TValue | undefined): void;

  find(deps: Deps<TKey>): Deps<{ path: Deps<TKey>; value: TValue }>;

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
    deps: Deps<TKey>,
  ): void;
};

export const createDeepCache = <TKey extends {}, TValue>(): DeepCache<
  TKey,
  TValue
> => {
  let cache: WeakCache<TKey, TValue> = new WeakMap();
  const deepCache = (
    createFn: () => TValue,
    foundFn: (found: TValue) => void,
    deps: Deps<TKey>,
  ) => {
    if (!deps.length) throw new Error("Dependencies need to exist.");
    const cachedValue = getWeakCacheItem(cache, deps);
    if (cachedValue) {
      foundFn(cachedValue);
      return cachedValue!;
    }
    const newObject = createFn();
    setWeakCacheItem(cache, deps, newObject);
    return newObject;
  };
  const upsert = (
    createFn: (previous: TValue | undefined) => TValue,
    deps: Deps<TKey>,
  ) => {
    if (!deps.length) throw new Error("Dependencies need to exist.");
    const cachedValue = getWeakCacheItem(cache, deps);
    const newObject = createFn(cachedValue);
    setWeakCacheItem(cache, deps, newObject);
  };

  const remove = (...deps: Deps<TKey>) => {
    removeWeakCacheItem(cache, deps);
  };

  const get = (deps: Deps<TKey>) => getWeakCacheItem(cache, deps);
  const set = (deps: Deps<TKey>, val: TValue) =>
    setWeakCacheItem(cache, deps, val);

  const longest = (deps: Deps<TKey>) => {
    let start = 0;

    const matches: {
      path: Deps<TKey>;
      value: TValue;
    }[] = [];

    for (let start = 0; start < deps.length; start++) {
      // Mutates these
      const matchedPath: Array<TKey> = [];

      const hasStart = cache.has(deps[start]);
      if (hasStart) {
        // Pointers
        let cachePointer = cache;
        let lastIsValue: TValue | undefined = undefined;
        for (let i = start; i < deps.length; i++) {
          const element = deps[i];

          const entry = cachePointer.get(element);
          if (entry) {
            const hasValue = entry.length === 2;
            matchedPath.push(element);
            if (hasValue) {
              lastIsValue = entry[1];
            }
            cachePointer = entry[0];
          } else {
          }
        }

        if (matchedPath.length > 0 && lastIsValue) {
          matches.push({
            path: matchedPath,
            value: lastIsValue,
          });
        }
      }
    }

    return matches;
  };

  return {
    find: longest,
    get,
    set,
    cache,
    deepCache,
    upsert,
    remove,
  };
};

const removeWeakCacheItem = <TKey extends {}, TValue>(
  cache: WeakCache<TKey, TValue>,
  deps: Deps<TKey>,
): void => {
  while (true) {
    const [dep, ...rest] = deps;
    let entry = cache.get(dep);
    if (!entry) {
      // No base level value
      // So nothing to remove
      return;
    }
    // We have hit the bottom of the tree when there are no more deps
    const isBottom = !rest.length;
    if (isBottom) {
      // We have hit the bottom of the tree
      entry[1] = undefined;
      return;
    } else {
      // Keep looping deeper
      cache = entry[0];
      deps = rest;
    }
  }
};
