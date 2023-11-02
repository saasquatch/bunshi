import { useActor } from "@xstate/react";
import { useMolecule } from "bunshi/react";
import React from "react";
import { CountMolecule } from "./molecules";

function Counter() {
  const countActor = useMolecule(CountMolecule);
  const [state, send] = useActor(countActor);
  const increment = () => send({ type: 'INCREMENT' });
  return (
    <div>
      <p>Times clicked: {state.context.count}</p>
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
