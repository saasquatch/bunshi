import { atom } from "jotai";
import { molecule } from "jotai-molecules/vue";


export const countMolecule = molecule(() => {

    const countAtom = atom(0);

    return {
        countAtom
    }
})
