import React from "react";
import { atom, useAtom } from "jotai";
import { molecule, createScope, ScopeProvider, useMolecule } from "../.";

export default {};

const CompanyScope = createScope<string>("example.com");

const CompanyMolecule = molecule((_, getScope) => {
  const company = getScope(CompanyScope);
  const companyNameAtom = atom(company.toUpperCase());
  return {
    company,
    companyNameAtom,
  };
});

const UserScope = createScope<string>("bob@example.com");

const UserMolecule = molecule((getMol, getScope) => {
  const userId = getScope(UserScope);
  const companyAtoms = getMol(CompanyMolecule);
  const userNameAtom = atom(userId + " name");
  const userCountryAtom = atom(userId + " country");
  const groupAtom = atom((get) => {
    return userId + " in " + get(companyAtoms.companyNameAtom);
  });
  return {
    userId,
    userCountryAtom,
    userNameAtom,
    groupAtom,
    company: companyAtoms.company,
  };
});

const UserComponent = () => {
  const userAtoms = useMolecule(UserMolecule);
  const [userName, setUserName] = useAtom(userAtoms.userNameAtom);

  return (
    <div>
      Hi, my name is {userName} <br />
      <input
        type="text"
        value={userName}
        onInput={(e) => setUserName((e.target as HTMLInputElement).value)}
      />
    </div>
  );
};

export const PeerProviders = () => (
  <>
    <ScopeProvider scope={UserScope} value={"sam@example.com"}>
      <UserComponent />
    </ScopeProvider>
    <ScopeProvider scope={UserScope} value={"notSam@example.com"}>
      <UserComponent />
    </ScopeProvider>
  </>
);

export const NestedProviders = () => (
  <>
    <ScopeProvider scope={UserScope} value={"sam@example.com"}>
      <UserComponent />
      <ScopeProvider scope={UserScope} value={"notSam@example.com"}>
        <UserComponent />
      </ScopeProvider>{" "}
    </ScopeProvider>
  </>
);
