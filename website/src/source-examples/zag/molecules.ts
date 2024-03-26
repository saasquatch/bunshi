import { molecule, onMount } from "bunshi";
import * as pagination from "@zag-js/pagination"


export const PaginationMolecule = molecule(() => {

  const service = pagination.machine({ count: 100, pageSize: 20 });

  onMount(() => {
    service._created();
    return () => service.stop();
  });
  return service;
});
