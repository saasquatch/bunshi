import { atom, useAtom, useAtomValue } from "jotai";
import {
  ScopeProvider,
  createScope,
  molecule,
  useMolecule,
} from "jotai-molecules";
import "./App.css";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

const Counter = molecule((_, scope) => {
  scope(UserScope);
  return atom(0);
});

const DoubleCounter = molecule((mol) => {
  const countAtom = mol(Counter);
  return atom((get) => get(countAtom) * 2);
});

const UserScope = createScope("person@example.com");

function App() {
  const [count, setCount] = useAtom(useMolecule(Counter));

  const doubleCount = useAtomValue(useMolecule(DoubleCounter));

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>Double value is {doubleCount}</p>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

function Wrapped() {
  return (
    <ScopeProvider scope={UserScope} value="something@example.com">
      <App />
    </ScopeProvider>
  );
}

export default Wrapped;
