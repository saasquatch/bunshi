import { useMolecule } from "bunshi/react";
import React from "react";
import { useStore } from "zustand";
import { CountMolecule } from "./molecules";

function Counter() {
  const countStore = useMolecule(CountMolecule);
  const { count, increment } = useStore(countStore);
  return (
    <div>
      <p>Times clicked: {count}</p>
      <button onClick={increment}>Increment count</button>
    </div>
  );
}
export default function App() {
  return (
    <div>
      <Counter />
      <Counter />
    </div>
  );
}
