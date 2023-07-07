import React from "react";
import { createStore } from "../../vanilla";

export const StoreContext = React.createContext(createStore());
StoreContext.displayName = "JotaiMoleculeStoreContext";
