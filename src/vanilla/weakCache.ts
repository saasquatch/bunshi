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
export type WeakCache<T> = WeakMap<object, [WeakCache<T>] | [WeakCache<T>, T]>;

const getWeakCacheItem = <T>(
  cache: WeakCache<T>,
  deps: Deps
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
  deps: Deps,
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

type Deps = readonly object[];

export const createDeepCache = () => {
  let cache: WeakCache<{}> = new WeakMap();
  const deepCache = <T extends {}>(
    createFn: () => T,
    deps: Deps
  ) => {
    const cachedAtom = getWeakCacheItem(cache, deps);
    if (cachedAtom) {
      return cachedAtom as T;
    }
    const newObject = createFn();
    setWeakCacheItem(cache, deps, newObject);
    return newObject;
  };
  
  return {
    getWeakCacheItem: (deps: Deps) => getWeakCacheItem(cache, deps),
    setWeakCacheItem: <T extends {}>(deps: Deps, newObject: T) => setWeakCacheItem(cache, deps, newObject),
    clear: ()=>{
      cache = new WeakMap();
    },
    cache,
    deepCache
  };
};
