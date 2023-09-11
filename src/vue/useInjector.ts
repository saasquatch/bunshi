import { inject, provide } from 'vue';
import type { MoleculeInjector } from '../vanilla';
import { defaultInjector } from '../vanilla';
import { InjectorSymbol } from './internal/symbols';


export const useInjector = () => inject(InjectorSymbol, defaultInjector);
export const provideInjector = (injector: MoleculeInjector) => provide(InjectorSymbol, injector)