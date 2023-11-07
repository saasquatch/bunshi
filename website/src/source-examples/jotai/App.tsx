import { useMolecule } from "bunshi/react";
import { useAtom, useAtomValue } from "jotai";
import React from "react";
import { CountMolecule, MultiplierMolecule } from "./molecules";

function Counter() {
  const { countAtom, valueAtom } = useMolecule(CountMolecule);
  const [count, setCount] = useAtom(countAtom);
  const value = useAtomValue(valueAtom);
  const increment = () => setCount((c) => c + 1);
  return (
    <div>
      <p>
        Clicks: {count} for total value {value}
      </p>
      <button onClick={increment}>Increment count</button>
    </div>
  );
}

function Multiplier() {
  const multiplierAtom = useMolecule(MultiplierMolecule);
  const [multiple, setMultiple] = useAtom(multiplierAtom);
  const increment = () => setMultiple((c) => c + 1);
  return (
    <div>
      <p>Multiplier: {multiple}</p>
      <button onClick={increment}>Increment multiplier</button>
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
