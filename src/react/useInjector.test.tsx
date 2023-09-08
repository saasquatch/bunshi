import { act, renderHook } from "@testing-library/react-hooks";
import { atom, getDefaultStore, useAtomValue } from "jotai";
import React from "react";
import { createInjector, molecule } from "../vanilla";
import { InjectorProvider } from "./InjectorProvider";
import { useMolecule } from "./useMolecule";

const NumberMolecule = molecule(() => 0);
const PiMolecule = molecule(() => 3.14);

test("Replace an injector provide bindings", () => {

    const injector1 = createInjector();
    const injector2 = createInjector({
        bindings: [[NumberMolecule, PiMolecule]]
    })


    const injectorAtom = atom(injector1);
    const swap = () => {
        const store = getDefaultStore();

        if (store.get(injectorAtom) === injector1) {
            store.set(injectorAtom, injector2);
        } else {
            store.set(injectorAtom, injector1);
        }
    }


    const Wrapper = ({ children }: { children?: React.ReactNode }) => {
        const injector = useAtomValue(injectorAtom);
        return (
            <InjectorProvider value={injector}>
                {children}
            </InjectorProvider>
        );
    }

    const useTestcase = () => useMolecule(NumberMolecule);

    const { result } = renderHook(useTestcase, {
        wrapper: Wrapper,
    });

    expect(result.current).toStrictEqual(0);

    act(() => swap());

    expect(result.current).toStrictEqual(3.14);

});