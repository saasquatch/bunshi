import { expect, test, type Page } from "@playwright/test";
import { SANDBOX_BOOT_TIMEOUT, sandpackPreview } from "./sandpack";

const clicks = (...counts: number[]) =>
  counts.map((count) => new RegExp(`Clicks: ${count}\\b`));

async function openCounters(page: Page, url: string) {
  const response = await page.goto(url);
  expect(response?.ok(), `${url} is not a registered example`).toBe(true);

  const preview = sandpackPreview(page);
  const counters = preview.locator('p:has-text("Clicks:")');
  await expect(counters).toHaveCount(2, { timeout: SANDBOX_BOOT_TIMEOUT });
  await expect(counters).toHaveText(clicks(0, 0));

  // Structural, so it ignores per-example button labels and the multiplier's button.
  const increments = preview.locator('p:has-text("Clicks:") + button');
  return { counters, increments };
}

/**
 * Tests the standard `examples.code.ts` counter examples for a category:
 * component state keeps the two counters independent, global state shares them.
 */
export function describeCounterRecipe(category: string) {
  test.describe(`${category} recipe`, () => {
    for (const framework of ["react", "vue"]) {
      test(`${framework} component state keeps counters independent`, async ({
        page,
      }) => {
        const { counters, increments } = await openCounters(
          page,
          `/test/${category}/${framework}ComponentState/`,
        );

        await increments.nth(0).click();
        await expect(counters).toHaveText(clicks(1, 0));
      });

      test(`${framework} global state shares counters`, async ({ page }) => {
        const { counters, increments } = await openCounters(
          page,
          `/test/${category}/${framework}GlobalState/`,
        );

        await increments.nth(0).click();
        await expect(counters).toHaveText(clicks(1, 1));

        await increments.nth(1).click();
        await expect(counters).toHaveText(clicks(2, 2));
      });
    }
  });
}
