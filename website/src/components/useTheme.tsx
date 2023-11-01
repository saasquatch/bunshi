import { useEffect, useState } from "react";
const EVENT_NAME = "starlight-theme-update";

export function useTheme() {
  const [theme, setTheme] = useState("auto");

  useEffect(() => {
    if (typeof document === "undefined") return;

    /* prevents hydration error so that state is only initialized after server is defined */
    setTheme(getStoredTheme());
  }, []);
  useEffect(() => {
    const listener = (e: Event) => {
      setTheme((e as CustomEvent).detail);
    };
    addEventListener(EVENT_NAME, listener);
    () => removeEventListener(EVENT_NAME, listener);
  }, [setTheme]);
  return theme;
}
function getStoredTheme() {
  if (typeof document === "undefined") return "light";
  const storedTheme =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("starlight-theme");
  const theme =
    storedTheme ||
    (window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark");
  return theme;
}

/**
 * Send events to listen to global theme change.
 *
 * Replaces the global `StarlightThemeProvider`
 *
 * Polyfill for
 *  - https://github.com/withastro/starlight/blob/main/packages/starlight/components/ThemeProvider.astro
 *  - https://github.com/withastro/starlight/blob/main/packages/starlight/components/ThemeSelect.astro
 *
 */
function polyfill() {
  function sendGlobalEvents(theme?: string) {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        bubbles: true,
        detail: theme,
      })
    );
  }
  // @ts-ignore;
  const old = window["StarlightThemeProvider"];
  const replacement = {
    updatePickers(theme?: string) {
      sendGlobalEvents(theme);
      old.updatePickers(theme);
    },
  };
  // @ts-ignore
  window["StarlightThemeProvider"] = replacement;
}

if (typeof document !== "undefined") polyfill();
