import { molecule, onMount } from "bunshi";
import { atom } from "jotai/vanilla";

export const CountMolecule = molecule(() => {
  console.log("Created");
  onMount(() => {
    console.log("Mounted");
    return () => console.log("Unmounted");
  });
  return atom(0);
});
