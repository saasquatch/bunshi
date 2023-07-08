import { inject, onUnmounted, provide } from 'vue';
import { MoleculeScopeOptions } from '../shared/MoleculeScopeOptions';
import { deregisterScopeTuple, registerMemoizedScopeTuple } from '../shared/memoized-scopes';
import { ScopeTuple, getDownstreamScopes } from '../vanilla';
import { useCache } from './useScopeCache';


export const ScopeKey = Symbol("jotai-molecules-scope");

export const useScopes = (options: MoleculeScopeOptions = {}): ScopeTuple<unknown>[] => {
    const parentScopes = inject(ScopeKey, [] as ScopeTuple<unknown>[]);
    const primitiveMap = useCache();

    const generatedValue = new Error("Don't use this value, it is a placeholder only");
    if (options?.exclusiveScope) {
        /**
         *  Exclusive scopes means ignore scopes from context
         */
        return [options.exclusiveScope];
    }

    const tuple: ScopeTuple<unknown> | undefined = (() => {
        if (options.withUniqueScope) {
            return [options.withUniqueScope, generatedValue] as ScopeTuple<unknown>;
        }
        if (options.withScope) {
            return options.withScope;
        }
        return undefined
    })();

    if (tuple) {
        const uniqueValue = Symbol(Math.random());
        const memoizedTuple = registerMemoizedScopeTuple(tuple, primitiveMap, uniqueValue)
        onUnmounted(() => {
            deregisterScopeTuple(tuple, primitiveMap, uniqueValue)
        });

        return getDownstreamScopes(parentScopes, memoizedTuple);
    }

    return parentScopes;
}

export const provideScope = (tuple: ScopeTuple<unknown>) => {
    provide(ScopeKey, useScopes({ withScope: tuple }));
}