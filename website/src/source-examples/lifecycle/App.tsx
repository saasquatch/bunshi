import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";
import React, { useState } from "react";
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
  const [isMounted, setMounted] = useState(false);
  return (
    <div>
      Open your browser console to see the logs for lifecycle events.
      <hr />
      <button onClick={() => setMounted((x) => !x)}>
        {isMounted ? "Remove Counter" : "Load Counter"}
      </button>
      {isMounted && (
        <>
          <Counter />
          <Counter />
        </>
      )}
    </div>
  );
}
