---
"bunshi": patch
---

Released molecules are garbage collected while a global molecule they depend on is still in use. Previously, a molecule's cleanup callbacks stayed registered on every scope it used, so a long-lived scope kept the released molecule's value in memory.
