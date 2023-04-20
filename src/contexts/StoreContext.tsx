import React from "react";
import { createStore } from "../store";

export const StoreContext = React.createContext(createStore());
StoreContext.displayName = "JotaiMoleculeStoreContext";
