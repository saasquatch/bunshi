export type MoleculeScope<T> = {
  defaultValue: T;
  displayName?: string;
};

export function createScope<T = undefined>(): MoleculeScope<undefined>;
export function createScope<T>(defaultValue: T): MoleculeScope<T>;

export function createScope(defaultValue?: unknown): MoleculeScope<unknown> {
  return {
    defaultValue,
  };
}
