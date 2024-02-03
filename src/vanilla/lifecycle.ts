import type {
  Molecule,
  MoleculeInterface,
  MoleculeOrInterface,
} from "./molecule";
import type { MoleculeScope } from "./scope";

class GlobalFunctionImplementation<T> {
  /**
   * This is structured as a stack to support nested
   * molecule call structures
   */
  private _s: T[] = [];
  push = (x: T) => {
    this._s.push(x);
  };
  pop = () => {
    this._s.pop();
  };
  active = (publicApi: string) => {
    const top = this._s[this._s.length - 1];
    if (!top)
      throw new Error(
        `Cannot call \`${publicApi}\` outside of a molecule function`,
      );
    return top;
  };
}

export type InternalOnMounted = typeof onMount;
export type InternalUse = typeof use;

export const onMountImpl =
  new GlobalFunctionImplementation<InternalOnMounted>();
export const useImpl = new GlobalFunctionImplementation<InternalUse>();

export type CleanupCallback = () => unknown;
export type MountedCallback = () => CleanupCallback | void;

/**
 * Registers a lifecyle callback for when a molecule is used (mounted).
 *
 * This lifecycle will be called everytime this molecule is used in a new
 * scope.
 *
 * For example, if your molecule is scoped by some `UserScope`
 * then `onMount` will be called for "User A" and "User B".
 *
 * ```ts
 * molecule(()=>{
 *    let i = 0;
 *    onMount(()=>{
 *      const id = setInterval(() => console.log("Ticking...", i++),1000);
 *      return () => clearInterval(id);
 *    })
 *   return i;
 * })
 * ```
 *
 * @param fn - A callback to run when a molecule is used
 */
export function onMount(fn: MountedCallback): void {
  onMountImpl.active("onMount")(fn);
}

/**
 * Registers a lifecyle callback for when a molecule is released (unmounted).
 *
 * This lifecycle will be called everytime this molecule that is used for a
 * scope has been released. This helps provide an opportunity to cleanup or
 * stop anything that is internally used.
 *
 * For example, if your molecule is scoped by some `UserScope`
 * then `onUnmount` will be called for when "User A" and "User B"
 * scopes are released.
 *
 * @param fn - A callback to run when a molecule is unmounted
 */
export function onUnmount(fn: CleanupCallback): void {
  onMountImpl.active("onUnmount")(() => fn);
}

/**
 * Use a dependency for this molecule. When you call `use`, then Bunshi will
 * automatically register that your molecule now depends on what you passed in.
 *
 * If you depend on a scoped molecule, or a scope, then that will change
 * how many instances of a molecule will be created. See [Scopes](https://www.bunshi.org/concepts/scopes/)
 * for more details on scoping.
 *
 *
 * Use a {@link MoleculeScope}:
 * ```ts
 * molecule(()=>use(UserScope));
 * ```
 *
 * Use a {@link Molecule}:
 * ```ts
 * molecule(()=>use(UserMolecule));
 * ```
 *
 * Use a {@link MoleculeInterface}:
 * ```ts
 * molecule(()=>use(NetworkMolecule));
 * ```
 *
 * @param dependency - A dependency for this molecule to use, either another molecule, interface or scope
 * @returns the value of the dependency
 */
export function use<T>(
  dependency: MoleculeOrInterface<T> | MoleculeScope<T>,
): T {
  return useImpl.active("use")(dependency);
}
