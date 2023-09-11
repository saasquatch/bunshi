import { inject, onUnmounted } from 'vue';
import type { MoleculeScopeOptions } from '../shared/MoleculeScopeOptions';
import type { ScopeTuple, } from '../vanilla';
import { getDownstreamScopes } from '../vanilla';
import { ScopeSymbol } from './internal/symbols';
import { useInjector } from './useInjector';


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
        const injector = useInjector();
        const [[memoizedTuple], unsub] = injector.useScopes(tuple);
        onUnmounted(unsub);
        return getDownstreamScopes(parentScopes, memoizedTuple);
    }

    return parentScopes;
}

