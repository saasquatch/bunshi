import { inject, provide } from 'vue';
import { MoleculeStore, defaultStore } from '../vanilla';
import { StoreSymbol } from './internal/symbols';


export const useStore = () => inject(StoreSymbol, defaultStore);
export const provideStore = (store: MoleculeStore) => provide(StoreSymbol, store)