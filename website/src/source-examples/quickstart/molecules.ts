import { molecule } from "bunshi";
import { atom } from "jotai/vanilla";

export const CountMolecule = molecule(() => atom(0));
