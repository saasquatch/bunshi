import { inject, provide } from 'vue';
import { defaultCache } from '../shared/memoized-scopes';

export const CacheKey = Symbol("jotai-molecules-scope-cache");

export const useCache = () => inject(CacheKey, defaultCache);
export const provideCache = (cache: WeakMap<any, unknown>) => provide(CacheKey, cache)