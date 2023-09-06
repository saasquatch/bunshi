import { useAtom } from 'jotai';
import { useMolecule } from "jotai-molecules/react";
import './App.css';
import { countMolecule } from './Molecules';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';

function App() {

  const { countAtom } = useMolecule(countMolecule);
  const [count, setCount] = useAtom(countAtom);

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
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
