import { atom, useAtom } from "jotai";
import React from "react";
import { molecule } from "../vanilla";
import { ComponentScope } from "./ComponentScope";
import { useMolecule } from "./useMolecule";

const ComponentScopedCountMolecule = molecule((_, scope) => {
    scope(ComponentScope);
    return atom(0);
});


const useCounter = () => useAtom(useMolecule(ComponentScopedCountMolecule));
const Counter = () => {
    const [count, setCount] = useCounter();
    return <div>
        Count is {count}
        <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
}

const TwoCounters = () => {
    return <>
        <Counter />
        <Counter />
    </>
}

test("TODO", () => {

    throw new Error("Implement me")
});