import { atom } from "jotai";
import { molecule } from "bunshi";


export const countMolecule = molecule(() => {

    const countAtom = atom(0);

    return {
        countAtom
    }
})
