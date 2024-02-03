import { useContext } from "react";
import { InjectorContext } from "./contexts/InjectorContext";

/**
 * Get the injector in context for this component. Defaults to the default global injector.
 *
 * @returns
 */
export function useInjector() {
  return useContext(InjectorContext)();
}
