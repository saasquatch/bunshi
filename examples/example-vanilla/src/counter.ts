import { defaultInjector } from "bunshi";
import { getDefaultStore } from "jotai/vanilla";
import { countMolecule } from "./Molecules";

const jotai = getDefaultStore();
const injector = defaultInjector;


export function setupCounter(element: HTMLButtonElement) {

  const { countAtom } = injector.get(countMolecule);

  const renderCounter = () => {
    const counter = jotai.get(countAtom);
    element.innerHTML = `count is ${counter}`;
  }
  element.addEventListener('click', () => jotai.set(countAtom, jotai.get(countAtom) + 1))

  renderCounter();
  return jotai.sub(countAtom, renderCounter);
}
