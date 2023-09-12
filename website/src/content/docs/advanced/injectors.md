---
title: "Injectors"
sidebar:
    order: 2
---

Bunshi is a [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) tool -- it creates instances of objects, classes and libraries for you on demand. The `injector` keeps track of all of those instances and stores them efficiently internally.

Most of the time you won't need to interact with the `injector` directly. It quietly works behind the scenes in the framework integrations. However, there are some cases when you may need to create your own injector to bind [molecule interfaces](/interfaces) to implementations.