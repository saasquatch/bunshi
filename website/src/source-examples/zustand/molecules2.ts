import { ComponentScope, molecule } from "bunshi";
import { createStore } from 'zustand/vanilla'

export const CountMolecule = molecule((_, scope) => {
  scope(ComponentScope);

  const store = createStore((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
  
  return store;
});