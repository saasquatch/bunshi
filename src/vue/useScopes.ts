import { inject, onUnmounted, provide } from 'vue';
import { MoleculeScopeOptions } from '../shared/MoleculeScopeOptions';
import { ScopeTuple, getDownstreamScopes } from '../vanilla';
import { ScopeSymbol } from './internal/symbols';
import { useStore } from './useStore';


export const useScopes = (options: MoleculeScopeOptions = {}): ScopeTuple<unknown>[] => {
    const parentScopes = inject(ScopeSymbol, [] as ScopeTuple<unknown>[]);

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
        const store = useStore();
        const [[memoizedTuple], unsub] = store.useScopes(tuple);
        onUnmounted(unsub);
        return getDownstreamScopes(parentScopes, memoizedTuple);
    }

    return parentScopes;
}

export const provideScope = (tuple: ScopeTuple<unknown>) => {
    provide(ScopeSymbol, useScopes({ withScope: tuple }));
}