import { MoleculeOrInterface } from "./molecule";
import { MoleculeScope } from "./scope";

class Impl<T> {
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
        `Cannot call \`${publicApi}\` outside of a molecule function`
      );
    return top;
  };
}

export type InternalOnMounted = typeof onMount;
export type InternalUse = typeof use;

export const onMountImpl = new Impl<InternalOnMounted>();
export const useImpl = new Impl<InternalUse>();

export type CleanupCallback = () => unknown;
export type MountedCallback = () => CleanupCallback | void;

export function onMount(fn: MountedCallback): void {
  onMountImpl.active("onMount")(fn);
}

export function onUnmount(fn: CleanupCallback): void {
  onMountImpl.active("onUnmount")(() => fn);
}

export function scope<T>(s: MoleculeScope<T>): T {
  return useImpl.active("scope")(s);
}

export function mol<T>(s: MoleculeOrInterface<T>): T {
  return useImpl.active("mol")(s);
}

export function use<T>(dep: MoleculeOrInterface<T> | MoleculeScope<T>): T {
  return useImpl.active("use")(dep);
}

export function inject<T>(dep: MoleculeOrInterface<T> | MoleculeScope<T>): T {
  return useImpl.active("inject")(dep);
}