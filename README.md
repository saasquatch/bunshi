# Jotai Molecules

## Installation

This module is published on NPM as `jotai-molecules`

```sh
npm i jotai-molecules
```

## Usage

Molecules are a set of atoms that can be easily scoped globally or per context.

```ts
const CompanyScope = createScope<string>('example.com');

const CompanyMolecule = molecule((_, getScope) => {
  const company = getScope(CompanyScope);
  const companyNameAtom = atom(company.toUpperCase());
  return {
    company,
    companyNameAtom,
  };
});

const UserScope = createScope<string>('bob@example.com');

const UserMolecule = molecule((getMol, getScope) => {
  const userId = getScope(UserScope);
  const companyAtoms = getMol(CompanyMolecule);
  const userNameAtom = atom(userId + ' name');
  const userCountryAtom = atom(userId + ' country');
  const groupAtom = atom((get) => {
    return userId + ' in ' + get(companyAtoms.companyNameAtom);
  });
  return {
    userId,
    userCountryAtom,
    userNameAtom,
    groupAtom,
    company: companyAtoms.company,
  };
});
```

```tsx
const App = () => (
  <ScopeProvider scope={UserScope} value={'sam@example.com'}>
    <UserComponent />
  </ScopeProvider>
);

const UserComponent = () => {
  const userAtoms = useMolecule(UserMolecule);
  const [userName, setUserName] = useAtom(userAtoms.userNameAtom);

  return <div>
    Hi, my name is {userName} <br/>
    <input type="text" value={userName} onInput={(e)=>setUserName(e.target.value)}>
  </div>
};
```

## Differences from Jotai

Molecules are very similar to `jotai` atoms, but with a few important differences:

- Molecules can't be async, atoms can
- Atom values are unique per a `jotai` scope, two atoms can't be connected across `jotai` scopes
- Molecules are unique per dependent molecule AND scope. Molecules can be connected across scopes
- Molecules are NOT updateable, they are only readable. If you want to make your molecules updateable, use atoms, or the atoms-in-atoms patterns.

## API

### molecule

Create a molecule that can be dependent on other molecules, or dependent on scope.

```ts
import { molecule } from 'jotai-molecules';

export const PageMolecule = molecule(() => {
  return {
    currentPage: atom('/'),
    currentParams: atom({}),
  };
});
```

- Requires a getter function
  - `getMol` - depend on the value of another molecule
  - `getScope` - depend on the value of a scope

### useMolecule

Use a molecule for the current scope. Will produce a different value depending on the React context it is run in.

```tsx
import { useMolecule } from 'jotai-molecules';
import { useSetAtom, useAtomValue } from 'jotai';

export const PageComponent = () => {
  const pageAtoms = useMolecule(PageMolecule);

  const setParams = useSetAtom(pageAtoms.currentPage);
  const page = useAtomValue(pageAtoms.currentPage);

  return (
    <div>
      Page: {page}
      <br />
      <button onClick={() => setParams({ date: Date.now() })}>
        Set current time
      </button>
    </div>
  );
};
```

### createScope

Creates a reference for scopes, similar to React Context

```ts
import { createScope } from 'jotai-molecules';

/**
 *  Scope for a user id
 */
export const UserScope = createScope<string>('bob@example.com');
```

- `initialValue` the default value for molecules that depend on this scope

### ScopeProvider

Provides a new value for Scope, similar to React Context. This will create new molecules in the react tree that depend on it.

```tsx
const App = () => (
  <ScopeProvider scope={UserScope} value={'sam@example.com'}>
    <UserComponent />
  </ScopeProvider>
);
```

- `scope` the `MoleculeScope` reference to provide
- `value` a new value for that scope
