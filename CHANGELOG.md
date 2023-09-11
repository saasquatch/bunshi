# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2023-04-20

Bunshi 2.0 is the next big release of `jotai-molecules`. We were working on adding `vue` support, and in the process realized that not only did
we not rely on any code from `jotai`, but also that the concept of dependency injection for the frontend that we were working on was actually
useful for a number of different tools and libraries.

For `vue` we realized that molecules are a useful way of sharing and scoping a `ref` across an application. This is similar to the goals of `pinia`,
but we could accomplish it in a more granular way without relying on strings keys.

We also saw that other tools like `valtio` suffer from the need for memoization. Valtio recommends using `useRef` for keeping a stable proxy scoped to
a component or a component tree.

So, instead of creating `vue-molecules` and `valtio-molecules` and others, we decided to keep it simple and rename our library.

The new name for `jotai-molecules` is Bunshi. bunshi (分子, ぶんし) is the japanese word for molecule. Why bunshi? We are big fans of `valtio`, `zustand` and `jotai`, 
so we wanted to keep with the tradition of naming libraries using other languages. If you didn't now, `zustand` is German for "state" and `valtio` is Finnish for "state".

The other thing that is releasing at the same time here is our new documentation website. It's difficult to keep everything up to date in a single Readme, so we moved to a static site generator.

Moving for `jotai-molecules` to `bunshi`? To migrate change your imports from `jotai-molecules` to `bunshi/react` for example:

```diff
- import { useMolecule, molecule } from "jotai-molecules"
+ import { useMolecule, molecule } from "bunshi/react"
```

### Changed
- Default export no longer returns react.
- Renamed from `jotai-molecules` to `bunshi`

### Added
- Vue support
- Vanilla JS support


## [1.1.1] - 2023-04-20

### Changed
- Updated license copyright to be in line with SaaSquatch open-source policy.

## [1.1.0] - 2022-05-31

- Added options for overriding scope in `useMolecule`. This removes the need for `ScopeProvider` in a number of cases.

## [1.0.3] - 2022-04-08

- Improve performance when using thousands of molecules

## [1.0.2] - 2022-04-08

- Fix bug with `ScopeProvider` where primitive values would not be cached
- Add `displayName` to molecule and scope

## [1.0.1] - 2022-04-07

- Fix bug with `ScopeProvider` with nested scopes being undefined

## [1.0.0] - 2022-03-31

Initial release of `jotai-molecules`

### Added

- `molecule` for creating a molecule or dependent molecule
- `useMolecule` a React hook for using a molecule
- `createScope` for creating a scope for molecules
- `ScopeProvider` a React component for providing scope to the tree

[unreleased]: https://github.com/saasquatch/jotai-molecules/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/saasquatch/jotai-molecules/releases/tag/v2.0.0
[1.1.1]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.1.1
[1.1.0]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.1.0
[1.0.3]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.3
[1.0.2]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.2
[1.0.1]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.1
[1.0.0]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.0
