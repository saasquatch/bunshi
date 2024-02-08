# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.1] - 2024-02-07

Minor release to fix bug in react `useMolecule`

### Fixed

- (React) `useMolecule` - When molecule returns a function, useMolecule should also return the same function #47 - thanks @3846masa

## [2.1.0] - 2024-01-22

Version 2.1.0 is a big update to Bunshi. It fixes a few key efficiency issues in #35 and #39. It introduces
the new `use` syntax for wiring up dependencies, and the new `onMount` and `onUnmount` lifecycle events
for cleaning up dependencies, even when the state management libraries themselves don't have it.

In the process of preparing this release, the number of test cases was expanded dramatically to
make sure that the lifecycle of bunshi molecules remains stable and predictable going forwards.
Some behaviour that was implicit is now being explicitly tested for.

Big thank you to the community for the help.

- @davidisaaclee for highlighting the issue of molecules being run too frequently in #39
- @asfktz for playing with XState and promoting the creation of cleanup lifecycle in #35. Thanks @Andarist for the pointers.
- @00salmon for providing feedback on the release candidates

### Changes

- Change to scoping. Object scopes will now be cleaned up, even for non-overlapping leases.
- Molecules callbacks are called more efficiently. Reduces the number of calls in many cases. Fixes #39. Thanks @davidisaaclee

### Added

- `onMount` and `onUnmount` lifecycle hooks inside of molecules. Fixes #35. Thanks @asfktz
- Support for React strict mode (and tests). Fixes #35
- New `use` syntax for depending on scopes or molecules,
- Add methods to injector and scope for using lazily to support React strict mode

## [2.1.0-rc.2] - 2024-01-08

### Added

- Add methods to injector and scope for using lazily to support React strict mode

### Removed

- Removed support for conditional dependencies. When detected, conditional dependencies will now throw an error.
- Removed `subscriptionId` from all calls (introduced in 2.1.0-rc.1)

## [2.1.0-rc.1] - 2023-11-23

### Changed

- Change to scoping. Object scopes will now be cleaned up, even for non-overlapping leases.
- Molecules callbacks are called more efficiently. Reduces the number of calls in many cases. Fixes #39
- Injectors have new methods to pass along a `subscriptionId` to ensure that default scopes can be used and cleaned up.

### Added

- `onMount` and `onUnmount` lifecycle hooks inside of molecules. Fixes #35
- New `use` syntax for depending on scopes or molecules

## [2.0.2] - 2023-11-01

### Fixed

- Changed bundling to support splits in common JS. Fixes #29

## [2.0.1] - 2023-09-21

### Changed

- Added `typesVersions` in `package.json` to support older typescript versions

## [2.0.0] - 2023-09-20

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

- Renamed from `jotai-molecules` to `bunshi`
- Default export no longer returns react. Users will need to change imports from `jotai-molecules` to `bunshi/react`

### Added

- `bunshi` Vanilla JS support
- `bunshi/vue` Vue support
- `bunshi/react` React-specific import
- `createInjector` and `getDefaultInjector` to access internal state
- `moleculeInterface` for creating bindable interfaces
- `ComponentScope` for pushing state down into components
- Documentation website

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

[unreleased]: https://github.com/saasquatch/jotai-molecules/compare/v2.1.1...HEAD
[2.1.1]: https://github.com/saasquatch/jotai-molecules/releases/tag/v2.1.1
[2.1.0]: https://github.com/saasquatch/jotai-molecules/releases/tag/v2.1.0
[2.1.0-rc.2]: https://github.com/saasquatch/jotai-molecules/releases/tag/v2.1.0-rc.2
[2.1.0-rc.1]: https://github.com/saasquatch/jotai-molecules/releases/tag/v2.1.0-rc.1
[2.0.2]: https://github.com/saasquatch/jotai-molecules/releases/tag/v2.0.2
[2.0.1]: https://github.com/saasquatch/jotai-molecules/releases/tag/v2.0.1
[2.0.0]: https://github.com/saasquatch/jotai-molecules/releases/tag/v2.0.0
[1.1.1]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.1.1
[1.1.0]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.1.0
[1.0.3]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.3
[1.0.2]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.2
[1.0.1]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.1
[1.0.0]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.0
