![Jotai (light mode)](./logo/bunshi.svg)

# Bunshi (formerly `jotai-molecules`)

- **[Documentation](https://bunshi.org)**

A tiny, fast, dependency-free 1.18kb library for creating states stores and other dependencies that lets you lift state up or push state down. Works out of the box with React, Vue and vanilla javascript and Typescript.

> Definition: Bunshi (分子 / ぶんし) - Japanese for molecule, member or element.

Works well with state solutions like:

- [jotai](https://jotai.org/) atoms
- [valtio](https://valtio.pmnd.rs/) proxies
- [zustand](https://zustand-demo.pmnd.rs/) stores
- [nanostores](https://github.com/nanostores/nanostores)
- [vue reactive](https://vuejs.org/guide/scaling-up/state-management.html#simple-state-management-with-reactivity-api)

Comes out of the box with support for:

- React
- Vue
- Vanilla Javascript & Typescript

See [the docs](https://bunshi.org) for more details on why we created this library and how to use it.

Inspired by [jotai](https://jotai.org/) and [guice](https://github.com/google/guice).

## Installation

This module is published on NPM as `bunshi`

```sh
npm i bunshi
```

## Documentation

Check out the docs on [bunshi.org](https://bunshi.org).

## Migrating from jotai-molecules

Coming from an older version of jotai-molecules? The core API and functionality is the same, but bunshi no longer
assumes react as the default use case.

```diff
import { atom } from "jotai"
- import { molecule, useMolecule } from "jotai-molecules"
+ import { molecule, useMolecule } from "bunshi/react"

const countMolecule = molecule(()=>atom(0));

const Counter = ()=>{

    const [count,setCount] = useAtom(useMolecule(countMolecule));

    return <div>
        Count is {count}
        <button onClick={()=>setCount(c=>c+1)}>Increment</button>
    </div>
}
```
