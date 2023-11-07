import { useMolecule } from "bunshi/react";
import React from "react";
import { useSnapshot } from "valtio";
import { CountMolecule, MultiplierMolecule } from "./molecules";

function Counter() {
  const { countProxy, valueProxy, increment } = useMolecule(CountMolecule);
  const count = useSnapshot(countProxy).count;
  const value = useSnapshot(valueProxy).value;
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
  const multiplierProxy = useMolecule(MultiplierMolecule);
  const snap = useSnapshot(multiplierProxy);
  const increment = () => multiplierProxy.count++;
  return (
    <div>
      <p>Multiplier: {snap.count}</p>
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
