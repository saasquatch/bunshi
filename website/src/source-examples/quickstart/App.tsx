import { useMolecule } from "bunshi/react";
import React from "react";
import { ResizeMolecule } from "./molecules";

export default function Resized() {
  const observer = useMolecule(ResizeMolecule);
  const style = {
    border: "2px solid",
    padding: "20px",
    width: "300px",
    resize: "both",
    overflow: "auto",
  } as const;
  return (
    <div style={style} ref={(el) => observer.observe(el)}>
      My size is being watched.
    </div>
  );
}
