import { provide } from 'vue';
import { ScopeTuple } from '../vanilla';
import { ScopeSymbol } from './internal/symbols';
import { useScopes } from './useScopes';


export const provideScope = (tuple: ScopeTuple<unknown>) => {
    provide(ScopeSymbol, useScopes({ withScope: tuple }));
};
