import { ComponentScope, molecule, onMount, use } from "bunshi";
import * as pagination from "@zag-js/pagination"

export const PaginationMolecule = molecule(() => {
  use(ComponentScope)

  const service = pagination.machine({ count: 100, pageSize: 20 });

  onMount(() => {
    service._created();
    return () => service.stop();
  });
  return service;
});
