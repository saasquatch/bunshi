import { inject, provide } from 'vue';
import { MoleculeStore, ScopeTuple, defaultStore } from '../vanilla';

export const ScopeKey = Symbol("jotai-molecules-scope");

export const useScopes = () => {
    inject(ScopeKey, defaultStore);
}

export const provideScope = (scope: ScopeTuple) => {

    provide(ScopeKey, store)
}