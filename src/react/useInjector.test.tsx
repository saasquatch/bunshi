import { act, renderHook } from "@testing-library/react-hooks";
import { atom, getDefaultStore, useAtomValue } from "jotai";
import React from "react";
import { MoleculeInjector, MoleculeOrInterface, createInjector, getDefaultInjector, molecule, moleculeInterface } from "../vanilla";
import { InjectorProvider } from "./InjectorProvider";
import { useMolecule } from "./useMolecule";

const defaultInjector = getDefaultInjector();

const NumberMolecule = moleculeInterface<number>();
const ZeroMolecule = molecule(() => 0);
const PiMolecule = molecule(() => 3.14);

// Returns a new unique object
const IdentityMolecule = molecule(() => Symbol());


test("Replace an injector provide bindings", () => {

    const injector1 = createInjector({
        bindings: [[NumberMolecule, ZeroMolecule]]
    });
    const injector2 = createInjector({
        bindings: [[NumberMolecule, PiMolecule]]
    });

    const { before, after } = testTwoInjectorSwap(NumberMolecule, injector1, injector2);

    expect(before).toStrictEqual(0);
    expect(after).toStrictEqual(3.14);
});


test("Default injector vs new injector", () => {

    const injector2 = createInjector();
    const { before, after } = testTwoInjectorSwap(IdentityMolecule, defaultInjector, injector2);

    // Different injectors, different values;
    expect(before).not.toStrictEqual(after);
});


test("Default injector twice", () => {

    const { before, after } = testTwoInjectorSwap(IdentityMolecule, defaultInjector, defaultInjector);

    // Same injectors, same values;
    expect(before).toStrictEqual(after);
});

test("Bind multiple molecules to the same source", () => {

    const IdentityMoleculeA = molecule(() => Symbol("a"));
    const IdentityMoleculeB = molecule(() => Symbol("b"));

    const injector2 = createInjector({
        bindings: [[IdentityMoleculeA, IdentityMolecule],
        [IdentityMoleculeB, IdentityMolecule]]
    });


    const { before: beforeA, after: afterA } = testTwoInjectorSwap(IdentityMoleculeA, defaultInjector, injector2);
    const { before: beforeB, after: afterB } = testTwoInjectorSwap(IdentityMoleculeB, defaultInjector, injector2);

    // Default injector returns different values because bindings are all the same
    expect(beforeA).not.toStrictEqual(beforeB);
    const defaultId = defaultInjector.get(IdentityMolecule);

    expect(beforeA).not.toStrictEqual(defaultId);
    expect(beforeB).not.toStrictEqual(defaultId);

    // Injector 2 has had the bindings swapped out, so everything is the same
    expect(afterA).toStrictEqual(afterB);
    const injector2ID = injector2.get(IdentityMolecule);
    expect(afterA).toStrictEqual(injector2ID);
    expect(afterB).toStrictEqual(injector2ID);
});


function testTwoInjectorSwap<T>(mol: MoleculeOrInterface<T>, firstInjector: MoleculeInjector, secondInjector: MoleculeInjector): { before: T, after: T } {
    const injectorAtom = atom(firstInjector);
    const swap = () => {
        const store = getDefaultStore();

        if (store.get(injectorAtom) === firstInjector) {
            store.set(injectorAtom, secondInjector);
        } else {
            store.set(injectorAtom, firstInjector);
        }
    };

    const Wrapper = ({ children }: { children?: React.ReactNode; }) => {
        const injector = useAtomValue(injectorAtom);
        return React.createElement(InjectorProvider, { value: injector }, children);
    };

    const useTestcase = () => useMolecule(mol);

    const { result } = renderHook(useTestcase, {
        wrapper: Wrapper,
    });

    const before = result.current;

    act(() => swap());
    const after = result.current;
    return { before, after };
}
