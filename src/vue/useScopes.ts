import { inject, onUnmounted } from 'vue';
import type { MoleculeScopeOptions } from '../shared/MoleculeScopeOptions';
import { getDownstreamScopes } from "../shared/getDownstreamScopes";
import { ComponentScope, type ScopeTuple } from '../vanilla';
import { ScopeSymbol } from './internal/symbols';
import { useInjector } from './useInjector';



/**
 * Gets the scopes implicitly in context for the current component.
 * 
 * Scope can also be explicitly provided to this hook.
 * 
 * @param options - to provide explicit scopes or scope overrides
 * @returns a set of scopes
 */
export const useScopes = (options: MoleculeScopeOptions = {}): ScopeTuple<unknown>[] => {
    const parentScopes = inject(ScopeSymbol, [] as ScopeTuple<unknown>[]);

    const generatedValue = new Error("Don't use this value, it is a placeholder only");
    if (options?.exclusiveScope) {
        /**
         *  Exclusive scopes means ignore scopes from context
         */
        return [options.exclusiveScope];
    }
    const componentScopeTuple = [ComponentScope, generatedValue] as ScopeTuple<unknown>;

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
        return getDownstreamScopes(getDownstreamScopes(parentScopes, memoizedTuple), componentScopeTuple);
    }

    return getDownstreamScopes(parentScopes, componentScopeTuple);
}

