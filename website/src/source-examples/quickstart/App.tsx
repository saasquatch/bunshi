import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";
import React from "react";
import { CountMolecule } from "./molecules";

function Counter() {
  const countAtom = useMolecule(CountMolecule);
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <p>Clicks: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
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
