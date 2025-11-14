import type { ComponentProps } from "react";
import type { SandpackSetup } from "@codesandbox/sandpack-react";
import { CodeEditor as ReactCodeEditor } from "./CodeEditor";

type SandpackProps = ComponentProps<typeof ReactCodeEditor>;

/**
 * Props for the CodeEditor Astro component
 */
export type CodeEditorProps = {
  template?: SandpackProps["template"];
  files?: SandpackProps["files"];
  dependencies?: SandpackSetup["dependencies"];
};

/**
 * Configuration object for code examples
 * This is a convenient type for defining example configs in .code.ts files
 */
export type CodeEditorConfig = CodeEditorProps;
