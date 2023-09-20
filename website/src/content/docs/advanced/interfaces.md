---
title: "Interfaces"
sidebar:
  order: 1
---

Sometimes you don't care about the implementation details. Your molecules need a dependency, but it doesn't matter where it comes from or how it's
implemented. Bunshi supports **interfaces** as a tool to fix this problem.

An interface defines a depencency, but not the implementation for the dependency or how it gets created.

## API

In other programming languages interfaces can be referenced at build time or runtime, but Javascript doesn't have interfaces and 
Typescript interfaceds don't exist at runtime.

Bunshi has `moleculeInterface` to create molecule interfaces that can be referenced and used at runtime.

```ts
import { moleculeInterface } from "bunshi";

export interface SendsEmail {
  sendEmail(recipient: string);
}

export const SendsEmailMolecule = moleculeInterface<SendsEmail>();
```

Molecules can depend on interfaces, not just other molecules.

```ts
import { molecule } from "bunshi";
import { SendsEmailMolecule } from "./molecules";
import { FormMolecule } from "./forms";

export const RegistrationFormMolecule = molecule((mol) => {
  const emailSender = mol(SendsEmailMolecule);
  const form = mol(FormMolecule);

  const onSubmit = () => {
    emailSender.sendEmail(form.getData().email);
  };

  return {
    form,
    onSubmit,
  };
});
```

## Tips

* Interfaces don't specify if they are scoped or not. Write your molecules accordingly.
* Bindings to interfaces have to be done in [injectors](/advanced/injectors).
* If you have a default implementation for an interface, then just use a `molecule` instead.
* [Scopes](/concepts/scopes) can act as a replacement for interfaces if you have a large number of implementations