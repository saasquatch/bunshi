export type CleanupCallback = () => unknown;
export type MountedCallback = () => CleanupCallback | void;

export type InternalOnMounted = (fn: MountedCallback) => void;

let __implementation: InternalOnMounted | undefined = undefined;

export function mounted(fn: MountedCallback): void {
  if (!__implementation) throw new Error("No cleanup function in scope");
  __implementation(fn);
}

export function __setImpl(implementation: InternalOnMounted | undefined) {
  __implementation = implementation;
}
