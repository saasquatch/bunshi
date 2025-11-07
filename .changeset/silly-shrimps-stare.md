---
"bunshi": minor
---

Add `parent` property to `createInjector`. This property enables hierarchical dependency injection by allowing child injectors to inherit and override dependencies from parent injectors. This creates a tree-like structure where:

- Child injectors can access and use the dependencies of their parent injectors.
- Dependencies can be overridden at the child injector level, allowing for more granular control over dependency resolution.

Add `MoleculeProvider` for React applications. This React component provides the implementation of a molecule interface for all molecules lower down in the React component tree. It uses the new parent-child injector hierarchy to ensure that existing molecule instances are preserved while allowing interface resolution.
