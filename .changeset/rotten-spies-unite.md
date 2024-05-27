---
"bunshi": patch
---

Improve handling for molecules that throw exceptions. This will no longer break the global `use` functions, or break `getMol` or `getScope`. Fixes #61
