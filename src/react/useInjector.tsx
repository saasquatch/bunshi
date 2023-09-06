import { useContext } from "react";
import { InjectorContext } from "./contexts/InjectorContext";

export function useInjector() {
  return useContext(InjectorContext);
}
