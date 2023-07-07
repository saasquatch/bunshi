import React from "react";
import { defaultStore } from "../../vanilla";

export const StoreContext = React.createContext(defaultStore);
StoreContext.displayName = "JotaiMoleculeStoreContext";
