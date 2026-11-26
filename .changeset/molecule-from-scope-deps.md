---
"bunshi": patch
---

A molecule that reads another molecule from a scope value (`getMol(getScope(ConfigScope))`) works again when the scope provides a different molecule. Since 2.2.0, switching to a second provided molecule threw "Molecule is using conditional dependencies", because each molecule's internal global scope was counted as a dependency.
