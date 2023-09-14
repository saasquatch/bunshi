import type { MoleculeScope, ScopeTuple } from "../vanilla";

export type MoleculeScopeOptions = {
  /**
   * By default {@link useMolecule} will use scopes based on the {@link ScopeContext}
   */
  withScope?: ScopeTuple<unknown>;
  withUniqueScope?: MoleculeScope<unknown>;
  exclusiveScope?: ScopeTuple<unknown>;
};
