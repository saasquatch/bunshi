import { test, expect } from "@playwright/test";
import { createSandpackHelper } from "../../../tests/helpers/sandpack";
import type { Page } from "@playwright/test";

/**
 * Helper to test component-scoped state (counters should be independent)
 * Nanostores examples have a Multiplier (global) and Counters (component-scoped in this case)
 */
async function testIndependentCounters(page: Page, url: string) {
  await page.goto(url);

  const sandpack = createSandpackHelper(page);
  const iframe = await sandpack.waitForSandpackIframe();

  // Wait for iframe content to be fully loaded
  let i = 0;
  while (i < 50) {
    console.log("Waiting for networkidle to load...", i, Date.now());
    try {
      await page.waitForLoadState("networkidle");
    } catch (e) {
      // Expected to timeout and throw errors
      console.log("Ignoring failed wait", Date.now());
    }
    i++;
  }

  let j = 0;
  while (j < 3) {
    try {
      await page.waitForTimeout(2000);
    } catch (e) {
      // Expected to timeout and throw errors
      console.log("Ignoring failed wait", Date.now());
    }
    console.log("Waiting for multiplier to load...", j, Date.now());
    j++;
  }

  // Use more flexible selectors that match partial text
  const multiplier = iframe.locator('p:has-text("Multiplier:")');
  const counters = iframe.locator("p").filter({ hasText: /Clicks/i });
  await expect(multiplier).toHaveCount(1);
  await expect(counters).toHaveCount(2);

  // Both counters start at 0
  await expect(counters.nth(0)).toContainText("0");
  await expect(counters.nth(1)).toContainText("0");

  // Click the first counter's button
  const buttons = iframe.locator("button").filter({ hasText: /Increment/i });
  await buttons.nth(0).click();
  await page.waitForTimeout(500);

  // First counter should increment, second should remain at 0 (independent state)
  await expect(counters.nth(0)).toContainText("1");
  await expect(counters.nth(1)).toContainText("0");
}

/**
 * Helper to test global state (counters should be synchronized)
 * In global state, the counter becomes global too
 */
async function testSynchronizedCounters(page: Page, url: string) {
  await page.goto(url);

  const sandpack = createSandpackHelper(page);
  const iframe = await sandpack.waitForSandpackIframe();

  // Wait for iframe content to be fully loaded
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Use more flexible selectors that match partial text
  const multiplier = iframe.locator("p").filter({ hasText: /Multiplier/i });
  const counters = iframe.locator("p").filter({ hasText: /Clicks/i });

  await multiplier.waitFor({
    timeout: 30000,
    state: "visible",
  });

  await expect(multiplier).toHaveCount(1);
  await expect(counters).toHaveCount(2);

  // Both counters start at 0
  await expect(counters.nth(0)).toContainText("0");
  await expect(counters.nth(1)).toContainText("0");

  // Click the first counter's button
  const buttons = iframe.locator("button").filter({ hasText: /Increment/i });
  await buttons.nth(0).click();
  await page.waitForTimeout(500);

  // Both counters should show 1 (shared global state)
  await expect(counters.nth(0)).toContainText("1");
  await expect(counters.nth(1)).toContainText("1");

  // Click the second counter's button
  await buttons.nth(1).click();
  await page.waitForTimeout(500);

  // Both counters should now show 2
  await expect(counters.nth(0)).toContainText("2");
  await expect(counters.nth(1)).toContainText("2");
}

test.describe("Nanostores Recipe", () => {
  test.describe("Component State Examples", () => {
    test("React component state - counters should have independent state", async ({
      page,
    }) => {
      await testIndependentCounters(
        page,
        "/test/nanostores/reactComponentState/",
      );
    });

    test("Vue component state - counters should have independent state", async ({
      page,
    }) => {
      await testIndependentCounters(
        page,
        "/test/nanostores/vueComponentState/",
      );
    });
  });

  test.describe("Global State Examples", () => {
    test("React global state - counters should share synchronized state", async ({
      page,
    }) => {
      await testSynchronizedCounters(
        page,
        "/test/nanostores/reactGlobalState/",
      );
    });

    test("Vue global state - counters should share synchronized state", async ({
      page,
    }) => {
      await testSynchronizedCounters(page, "/test/nanostores/vueGlobalState/");
    });
  });
});
