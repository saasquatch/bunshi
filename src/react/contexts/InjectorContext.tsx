import React from "react";
import { defaultInjector } from "../../vanilla";

export const InjectorContext = React.createContext(defaultInjector);
InjectorContext.displayName = "JotaiMoleculeInjectorContext";
