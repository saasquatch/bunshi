import { molecule } from "bunshi";

export const ResizeMolecule = molecule(
  () => new ResizeObserver((e) => console.log("Resize", e))
);
