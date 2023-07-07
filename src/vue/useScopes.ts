import { inject, onUnmounted, provide } from 'vue';
import { MoleculeScopeOptions } from '../shared/MoleculeScopeOptions';
import { deregisterScopeTuple, registerMemoizedScopeTuple } from '../shared/memoized-scopes';
import { ScopeTuple, getDownstreamScopes } from '../vanilla';
import { useCache } from './useScopeCache';


export const ScopeKey = Symbol("jotai-molecules-scope");

export const useScopes = (options: MoleculeScopeOptions = {}): ScopeTuple<unknown>[] => {
    const parentScopes = inject(ScopeKey, []);
    const primitiveMap = useCache();
    if (options.exclusiveScope) return [options.exclusiveScope];
    if (options.withScope) {
        return getDownstreamScopes(parentScopes, options.withScope);
    }

    if (options.withUniqueScope) {
        const uniqueValue = Symbol(Math.random());
        const tuple: ScopeTuple<unknown> = [options.withUniqueScope, new Error("Don't use this value, it is a placeholder only")];
        registerMemoizedScopeTuple(tuple, primitiveMap, uniqueValue)
        onUnmounted(() => {
            deregisterScopeTuple(tuple, primitiveMap, uniqueValue)
        });

        return getDownstreamScopes(parentScopes, tuple);
    }

    return parentScopes;
}

export const provideScope = (tuple: ScopeTuple<unknown>) => {
    provide(ScopeKey, useScopes({ withScope: tuple }));
}