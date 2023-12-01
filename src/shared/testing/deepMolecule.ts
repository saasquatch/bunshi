import {
  Molecule,
  MoleculeOrInterface,
  MoleculeScope,
  molecule,
  use,
} from "../../vanilla";

export function createDeepMolecule<T>(props: {
  rootDependency: MoleculeOrInterface<T> | MoleculeScope<T>;
  depth: number;
}) {
  return Array.from({ length: props.depth }).reduce((prev, current) => {
    return molecule(() => use(prev as any));
  }, props.rootDependency) as Molecule<T>;
}
