import { Atom, atom, PrimitiveAtom } from "jotai";
import { molecule } from "../molecule";
import { createScope } from "../scope";
import { ScopeTuple } from "../types";
import { Molecule, use } from "..";

export type BaseAtoms = {
  nameAtom: PrimitiveAtom<string>;
};
export const exampleMol = molecule<BaseAtoms>(() => {
  return {
    nameAtom: atom(`${Math.random()}`),
  };
});
const UnrelatedScope = createScope<number>(1);
export const unrelatedScope1: ScopeTuple<number> = [UnrelatedScope, 1];
export const UserScope = createScope<string>("bob@example.com");
export const user1Scope: ScopeTuple<string> = [UserScope, "one@example.com"];
export const user2Scope: ScopeTuple<string> = [UserScope, "two@example.com"];
export const CompanyScope = createScope<string>("example.com");
export const company1Scope: ScopeTuple<string> = [
  CompanyScope,
  "one.example.com",
];
export const company2Scope: ScopeTuple<string> = [
  CompanyScope,
  "two.example.com",
];
export const userMolecule = molecule((mol, scope) => {
  const userId = scope(UserScope);
  const company = mol(companyMolecule);
  const userNameAtom = atom(userId + " name");
  const userCountryAtom = atom(userId + " country");
  const groupAtom = atom((get) => {
    return userId + " in " + get(company.companyNameAtom);
  });
  return {
    userId,
    userCountryAtom,
    userNameAtom,
    groupAtom,
    company: company.company,
  };
});
export const companyMolecule = molecule((_, getScope) => {
  const company = getScope(CompanyScope);
  const companyNameAtom = atom(company.toUpperCase());
  return {
    company,
    companyNameAtom,
  };
});

type Config = {
  example: Atom<string>;
};

export const ConfigMolecule = molecule<Config>(() => {
  return {
    example: atom("example"),
  };
});

export const ConfigScope = createScope<Molecule<Config> | undefined>(undefined);

export const LibaryMolecule = molecule(() => {
  const configMol = use(ConfigScope);
  if (!configMol)
    throw new Error("This molecule requires ConfigScope to function!");

  const config = use(configMol) as Config;
  const derivedAtom = atom((get) => get(config.example).toUpperCase());

  return {
    ...config,
    derivedAtom,
  };
});
