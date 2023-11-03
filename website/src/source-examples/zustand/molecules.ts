import { molecule } from "bunshi";
import { createStore } from 'zustand/vanilla'

export const CountMolecule = molecule((_, scope) => {
  const store = createStore((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
  
  return store;
});
