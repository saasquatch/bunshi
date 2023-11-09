import { MoleculeOrInterface } from "./molecule";
import { MoleculeScope } from "./scope";

export type CleanupCallback = () => unknown;
export type MountedCallback = () => CleanupCallback | void;

export type InternalOnMounted = typeof onMount;
export type InternalUse = typeof use;

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
  active = () => this._s[this._s.length - 1];
}

export const onMountImpl = new Impl<InternalOnMounted>();
export const useImpl = new Impl<InternalUse>();

export function onMount(fn: MountedCallback): void {
  const active = onMountImpl.active();
  if (!active)
    throw new Error("Cannot call `onMount` outside of a molecule function");
  active(fn);
}

export function scope<T>(s: MoleculeScope<T>): T {
  return use(s);
}
export function mol<T>(s: MoleculeOrInterface<T>): T {
  return use(s);
}
export function use<T>(dep: MoleculeOrInterface<T> | MoleculeScope<T>): T {
  const active = useImpl.active();
  if (!active)
    throw new Error("Cannot call `use` outside of a molecule function");
  return active(dep);
}
