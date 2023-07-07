import React from "react";
import { createStore } from "../vanilla/store";

export const StoreContext = React.createContext(createStore());
StoreContext.displayName = "JotaiMoleculeStoreContext";
