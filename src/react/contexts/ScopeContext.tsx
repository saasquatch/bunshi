import React from "react";
import type { ScopeTuple } from "../../vanilla";

export const ScopeContext = React.createContext<ScopeTuple<unknown>[]>([]);
ScopeContext.displayName = "JotaiMoleculeScopeContext";
