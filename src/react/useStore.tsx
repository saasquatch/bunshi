import { useContext } from "react";
import { StoreContext } from "./contexts/StoreContext";

export function useStore() {
  return useContext(StoreContext);
}
