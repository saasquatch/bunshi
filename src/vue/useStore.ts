import { inject, provide } from 'vue';
import { MoleculeStore, defaultStore } from '../vanilla';

export const StoreKey = Symbol("jotai-molecules-store");

export const useStore = () => inject(StoreKey, defaultStore);
export const injectStore = useStore;
export const provideStore = (store: MoleculeStore) => provide(StoreKey, store)