import { act, renderHook } from '@testing-library/react-hooks';
import { atom, useAtom } from "jotai";
import { ComponentScope, molecule } from "./";
import { createTestInjectorProvider } from './internal/TestInjectorProvider';
import { useMolecule } from "./useMolecule";

const ComponentScopedCountMolecule = molecule((_, scope) => {
    scope(ComponentScope);
    return atom(0);
});

const GlobalScopedMoleculeCountMolecule = molecule((_, scope) => {
    return atom(0);
});

const useCounter = (mol: typeof ComponentScopedCountMolecule) => {
    const [count, setCount] = useAtom(useMolecule(mol))
    return {
        count,
        increment: () => setCount(c => c + 1)
    }
};


describe("Global scoped molecules", () => {
    test('should increment counter', () => {
        testOneCounter(GlobalScopedMoleculeCountMolecule, 1);
    })
    test('two counters should be connected for global scope', () => {
        // Note: This is an important test case, because 
        // it makes sure that our `testTwoCounters` function
        // can tell the difference between a globally 
        // scoped molecule and not component-scope molecule
        testTwoCounters(GlobalScopedMoleculeCountMolecule, 2);
    })
})

describe("Component scoped molecules", () => {
    test('should increment counter', () => {
        testOneCounter(ComponentScopedCountMolecule, 1);
    })
    test('two counters should be not be connected when component scoped', () => {
        testTwoCounters(ComponentScopedCountMolecule, 1);
    })

})

function testOneCounter(mol: typeof ComponentScopedCountMolecule, expectedResult: number) {

    const TestInjectorProvider = createTestInjectorProvider();

    const { result } = renderHook(() => useCounter(mol), { wrapper: TestInjectorProvider });

    act(() => {
        result.current.increment();
    });

    expect(result.current.count).toBe(expectedResult);
}

function testTwoCounters(mol: typeof ComponentScopedCountMolecule, expectedResult: number) {

    const TestInjectorProvider = createTestInjectorProvider();

    const { result: result1 } = renderHook(() => useCounter(mol), { wrapper: TestInjectorProvider });
    const { result: result2 } = renderHook(() => useCounter(mol), { wrapper: TestInjectorProvider });

    act(() => {
        result1.current.increment();
    });
    act(() => {
        result2.current.increment();
    });

    expect(result1.current.count).toBe(expectedResult);
    expect(result2.current.count).toBe(expectedResult);
}
