import { createScope } from "./scope";

/**
 * Component scope is handled in a special way.
 *
 * Unlike other scopes, it will always have a unique value for every component it's used in.
 * That makes it possible to create component-scoped state using molecules in the same
 * way that global state or other scoped state is created.
 *
 * @example
 * Counter state (React)
 * ```ts
 * const CounterM = molecule((_, scope) => {
 *    scope(ComponentScope);
 *    return atom(0);
 * });
 *
 * // State will NOT be shared between components
 * const useCounter = () => useAtom(useMolecule(CounterM));
 *
 * // The above is equivalent to:
 * // const useCounter = useAtom(useRef(atom(0)).current);
 *
 * // The above is also equivalent to:
 * // const useCounter = useState(0)
 * ```
 * @example
 * Counter state (Vue)
 * ```ts
 * const CounterM = molecule((_, scope) => {
 *    scope(ComponentScope);
 *    return ref(0);
 * });
 *
 * // State will NOT be shared between components
 * const useCounter = () => useMolecule(CounterM);
 *
 * // The above is equivalent to:
 * // const useCounter = () => ref(0)
 * ```
 */
export const ComponentScope = createScope<undefined>(undefined, {
  debugLabel: "Component Scope",
});
