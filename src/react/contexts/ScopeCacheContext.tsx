import React from "react";
import { PrimitiveScopeMap } from "../../vanilla";

export const ScopeCacheContext = React.createContext<PrimitiveScopeMap>(
  new WeakMap()
);
ScopeCacheContext.displayName = "JotaiMoleculeScopeCacheContext";
