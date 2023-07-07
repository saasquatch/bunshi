import React from "react";
import { PrimitiveScopeMap } from "../../vanilla/types";

export const ScopeCacheContext = React.createContext<PrimitiveScopeMap>(
  new WeakMap()
);
ScopeCacheContext.displayName = "JotaiMoleculeScopeCacheContext";
