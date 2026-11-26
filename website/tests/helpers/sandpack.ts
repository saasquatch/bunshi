import type { FrameLocator, Page } from "@playwright/test";

// Vue (Nodebox) templates install deps and boot Vite in-browser: ~20s locally, slower on CI.
export const SANDBOX_BOOT_TIMEOUT = 90_000;

// Matches both the React bundler iframe and the Nodebox iframe, whose src has no "sandpack".
export function sandpackPreview(page: Page): FrameLocator {
  return page.frameLocator('iframe[title="Sandpack Preview"]');
}
