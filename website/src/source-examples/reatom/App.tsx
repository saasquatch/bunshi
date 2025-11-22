import { useAtom, useAction, reatomContext, useCtx } from "@reatom/npm-react";
import { createCtx } from "@reatom/core";
import { useMolecule } from "bunshi/react";
import React from "react";
import { CountMolecule, MultiplierMolecule } from "./molecules";

const ctx = createCtx();

function Counter() {
  const { countAtom, valueAtom, increment } = useMolecule(CountMolecule);
  const [count] = useAtom(countAtom);
  const [value] = useAtom(valueAtom);
  const handleIncrementClick = useAction(increment);
  return (
    <div>
      <p>
        Clicks: {count} for total value {value}
      </p>
      <button onClick={handleIncrementClick}>Increment count</button>
    </div>
  );
}

function Multiplier() {
  const { multiplierAtom } = useMolecule(MultiplierMolecule);
  const [multiplier] = useAtom(multiplierAtom);
  const incrementMultiplier = useAction((ctx) =>
    multiplierAtom(ctx, (multiplier) => multiplier + 1),
  );
  return (
    <div>
      <p>Multiplier: {multiplier}</p>
      <button onClick={incrementMultiplier}>Increment multiplier</button>
    </div>
  );
}

function Main() {
  return (
    <div>
      <Multiplier />
      <Counter />
      <Counter />
    </div>
  );
}

export default function App() {
  return (
    <reatomContext.Provider value={ctx}>
      <Main />
    </reatomContext.Provider>
  );
}
