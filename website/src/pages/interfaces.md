---
layout: ../layouts/BaseLayout.astro
title: "Interfaces"
---

# Interfaces

Molecules can have dependencies but sometimes you don't care or know about the implementation details. To help Bunshi support interfaces for molecules.

An interface defines a depencency, but not the implementation for the dependency or how it gets created. 
    
## API

In other programming languages interfaces can be referenced at build time or runtime, but Javascript and Typescript don't have that simplicity. So, we need to create molecule interfaces as objects for later.

```ts
import { moleculeInterface } from "bunshi";

export interface SendsEmail {
    sendEmail(recipient:string);
}

export const SendsEmailMolecule = moleculeInterface<SendsEmail>();
```

Molecules can depend on these interfaces, not just other molecules.

```ts
import { molecule } from "bunshi";
import { SendsEmailMolecule } from "./molecules";
import { FormMolecule } from "./forms";

export const RegistrationFormMolecule = molecule((mol)=>{

    const emailSender = mol(SendsEmailMolecule);
    const form = mol(FormMolecule);

    const onSubmit = ()=>{
        emailSender.sendEmail(form.getData().email)
    };

    return {
        form,
        onSubmit
    }
})
```