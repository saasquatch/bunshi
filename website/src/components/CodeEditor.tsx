import { Sandpack } from "@codesandbox/sandpack-react";
import React, { type ComponentProps } from "react";
import { useTheme } from "./useTheme";

type SandpackProps = ComponentProps<typeof Sandpack>;

export function CodeEditor(props: Omit<SandpackProps, "theme">) {
  const theme = useTheme();
  return <Sandpack {...props} theme={theme as any} />;
}
