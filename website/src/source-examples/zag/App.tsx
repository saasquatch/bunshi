import { useMolecule } from "bunshi/react";
import React from "react";

import * as pagination from "@zag-js/pagination";
import { normalizeProps, useActor } from "@zag-js/react";

import { PaginationMolecule } from "./molecules";
import "./style.css";

function Pagination() {
  const actor = useMolecule(PaginationMolecule);
  const [state, send] = useActor(actor);

  const api = pagination.connect(state, send, normalizeProps)

  return (
    <div>
      {api.totalPages > 1 && (
        <nav {...api.rootProps}>
          <ul>
            <li>
              <a href="#previous" {...api.prevTriggerProps}>
                &lt; <span className="visually-hidden">Previous Page</span>
              </a>
            </li>
            {api.pages.map((page, i) => {
              if (page.type === "page")
                return (
                  <li key={page.value}>
                    <a href={`#${page.value}`} {...api.getItemProps(page)}>
                      {page.value}
                    </a>
                  </li>
                )
              else
                return (
                  <li key={`ellipsis-${i}`}>
                    <span {...api.getEllipsisProps({ index: i })}>&#8230;</span>
                  </li>
                )
            })}
            <li>
              <a href="#next" {...api.nextTriggerProps}>
                &gt; <span className="visually-hidden">Next Page</span>
              </a>
            </li>
          </ul>
        </nav>
      )}
    </div>
  )
}
export default function App() {
  return (
    <div>
      <Pagination />
      <Pagination />
    </div>
  );
}
