import { atom, useAtom } from "jotai";
import React from "react";
import { molecule } from "../vanilla/molecule";
import { createScope } from "../vanilla/scope";
import { ScopeProvider } from "./ScopeProvider";
import { useMolecule } from "./useMolecule";

export default {};

export const Div = () => <div>I am a div</div>;

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

const numbers = [];
for (let i = 0; i < 1000; i++) {
  numbers.push(i);
}
const NestedMol = numbers.reduce(
  (prev) => molecule((getMol) => getMol(prev)),
  UserMolecule
);
const NestedComponent = () => {
  const args = useMolecule(NestedMol);
  return <div>{`${args}`}</div>;
};
export const LoadTest = () => {
  const elements = [];

  for (let i = 0; i < 100; i++) {
    elements.push(<NestedComponent key={i} />);
  }
  return (
    <>
      <ScopeProvider scope={UserScope} value={"sam@example.com"}>
        {elements}
      </ScopeProvider>
    </>
  );
};
