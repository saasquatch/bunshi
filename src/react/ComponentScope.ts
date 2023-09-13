import { createScope } from "../vanilla";

/**
 * Component scope is handled in a special way.
 * 
 * Unlike other scopes, it will always have a unique value for every component it's used in. 
 * That makes it possible to create component-scoped state using molecules in the same
 * way that global state or other scoped state is created.
 * 
 * @example
 * Counter state
 * ```ts
 * const CounterM = molecule((_, scope) => {
 *    scope(ComponentScope);
 *    return atom(0);
 * });
 * 
 * // Similar to useState, but allows for the state to be hoisted, moved,
 * // depended on in other molecules and refactored without updating the component
 * const useCounter = () => useAtom(useMolecule(CounterM));
 * // const useCounter = useState(0)
* ```
 */
export const ComponentScope = createScope<undefined>(undefined);