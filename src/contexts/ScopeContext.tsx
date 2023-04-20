import React from "react";
import type { ScopeTuple } from "../types";

export const ScopeContext = React.createContext<ScopeTuple<unknown>[]>([]);
ScopeContext.displayName = "JotaiMoleculeScopeContext";
