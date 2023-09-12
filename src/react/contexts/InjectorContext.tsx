import React from "react";
import { getDefaultInjector } from "../../vanilla";

export const InjectorContext = React.createContext(getDefaultInjector());
InjectorContext.displayName = "BunshiMoleculeInjectorContext";
