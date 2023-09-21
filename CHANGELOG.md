# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2023-04-20

Version 1.2.0 of `jotai-molecules` will be the final release in the 1.x branch (except for security patches).

Version 2 of `jotai-molecules` has been renamed to `bunshi` and is mostly backwards compatible with the API,
but requires changes to imports and uses different internals. Because of this, we release 1.2 as a shim to 
simplify the migration process.

This version should be able to interoperate with `bunshi`, so you can gradually move your imports over.

### Changed
- Internally uses `bunshi`, the next version of jotai-molecules
- Removed peer dependency on `jotai`

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

[unreleased]: https://github.com/saasquatch/jotai-molecules/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.2.0
[1.1.1]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.1.1
[1.1.0]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.1.0
[1.0.3]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.3
[1.0.2]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.2
[1.0.1]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.1
[1.0.0]: https://github.com/saasquatch/jotai-molecules/releases/tag/v1.0.0
