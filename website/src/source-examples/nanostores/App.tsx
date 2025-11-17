import { useStore } from "@nanostores/react";
import { useMolecule } from "bunshi/react";
import React from "react";
import { CountMolecule, MultiplierMolecule } from "./molecules";

function Counter() {
  const { countAtom, valueAtom, increment } = useMolecule(CountMolecule);
  const count = useStore(countAtom);
  const value = useStore(valueAtom);
  return (
    <div>
      <p>
        Clicks: {count} for total value {value}
      </p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

function Multiplier() {
  const multiplierAtom = useMolecule(MultiplierMolecule);
  const multiple = useStore(multiplierAtom);
  const increment = () => multiplierAtom.set(multiplierAtom.get() + 1);
  return (
    <div>
      <p>Multiplier: {multiple}</p>
      <button onClick={increment}>Multiply</button>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <Multiplier />
      <Counter />
      <Counter />
    </div>
  );
}
