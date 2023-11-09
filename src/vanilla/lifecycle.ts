export type CleanupCallback = () => unknown;
export type MountedCallback = () => CleanupCallback | void;

export type InternalOnMounted = (fn: MountedCallback) => void;

/**
 * This is structured as a stack to support nested
 * molecule dependencies
 */
let __implementationStack: InternalOnMounted[] = [];

function __getActive() {
  return __implementationStack[__implementationStack.length - 1];
}

export function mounted(fn: MountedCallback): void {
  const active = __getActive();
  if (!active) throw new Error("No cleanup function in scope");
  active(fn);
}

export function __pushImpl(implementation: InternalOnMounted) {
  __implementationStack.push(implementation);
}

export function __popImpl() {
  __implementationStack.pop();
}
