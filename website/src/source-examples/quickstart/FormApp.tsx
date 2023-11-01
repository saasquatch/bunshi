import { ScopeProvider, useMolecule } from "bunshi/react";
import { useAtom } from "jotai";
import React from "react";
import { CountMolecule, FormScope } from "./molecules";

export default function App() {
  return (
    <div>
      <Form name="One">
        <Counter />
        <Counter />
      </Form>
      <Form name="Two">
        <Counter />
        <Counter />
      </Form>
    </div>
  );
}

const Form: React.FC<{ name: string; children: React.ReactNode }> = ({
  name,
  children,
}) => {
  return (
    <div>
      Form {name}
      <ScopeProvider scope={FormScope} value={name}>
        {children}
      </ScopeProvider>
    </div>
  );
};

function Counter() {
  const countAtom = useMolecule(CountMolecule);
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <p>Times clicked: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}
