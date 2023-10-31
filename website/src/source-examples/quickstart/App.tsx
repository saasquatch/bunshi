import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";
import React from "react";
import { CountMolecule } from "./molecules";

export default function App() {
  return (
    <div>
      <Counter />
      <Counter />
    </div>
  );
}

function Counter() {
  const countAtom = useMolecule(CountMolecule);

  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <p>Times clicked: { count }</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}
