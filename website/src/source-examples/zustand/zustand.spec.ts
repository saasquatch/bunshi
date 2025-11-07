import { test, expect } from '@playwright/test';
import { createSandpackHelper } from '../../../tests/helpers/sandpack';
import type { Page } from '@playwright/test';

/**
 * Helper to test component-scoped state (counters should be independent)
 */
async function testIndependentCounters(page: Page, url: string) {
  await page.goto(url);
  
  const sandpack = createSandpackHelper(page);
  const iframe = await sandpack.waitForSandpackIframe();
  
  // Verify two counters exist
  const counters = iframe.locator('p:has-text("Clicks:")');
  await expect(counters).toHaveCount(2);
  
  // Both counters start at 0
  await expect(counters.nth(0)).toContainText('Clicks: 0');
  await expect(counters.nth(1)).toContainText('Clicks: 0');
  
  // Click the first counter's button
  const buttons = iframe.locator('button:has-text("Increment")');
  await buttons.nth(0).click();
  await page.waitForTimeout(500);
  
  // First counter should increment, second should remain at 0 (independent state)
  await expect(counters.nth(0)).toContainText('Clicks: 1');
  await expect(counters.nth(1)).toContainText('Clicks: 0');
}

/**
 * Helper to test global state (counters should be synchronized)
 */
async function testSynchronizedCounters(page: Page, url: string) {
  await page.goto(url);
  
  const sandpack = createSandpackHelper(page);
  const iframe = await sandpack.waitForSandpackIframe();
  
  // Verify two counters exist
  const counters = iframe.locator('p:has-text("Clicks:")');
  await expect(counters).toHaveCount(2);
  
  // Both counters start at 0
  await expect(counters.nth(0)).toContainText('Clicks: 0');
  await expect(counters.nth(1)).toContainText('Clicks: 0');
  
  // Click the first counter's button
  const buttons = iframe.locator('button:has-text("Increment")');
  await buttons.nth(0).click();
  await page.waitForTimeout(500);
  
  // Both counters should show 1 (shared global state)
  await expect(counters.nth(0)).toContainText('Clicks: 1');
  await expect(counters.nth(1)).toContainText('Clicks: 1');
  
  // Click the second counter's button
  await buttons.nth(1).click();
  await page.waitForTimeout(500);
  
  // Both counters should now show 2
  await expect(counters.nth(0)).toContainText('Clicks: 2');
  await expect(counters.nth(1)).toContainText('Clicks: 2');
}

test.describe('Zustand Recipe', () => {
  test.describe('Component State Examples', () => {
    test('React component state - counters should have independent state', async ({ page }) => {
      await testIndependentCounters(page, '/test/zustand/reactComponentState/');
    });

    test('Vue component state - counters should have independent state', async ({ page }) => {
      await testIndependentCounters(page, '/test/zustand/vueComponentState/');
    });
  });

  test.describe('Global State Examples', () => {
    test('React global state - counters should share synchronized state', async ({ page }) => {
      await testSynchronizedCounters(page, '/test/zustand/reactGlobalState/');
    });

    test('Vue global state - counters should share synchronized state', async ({ page }) => {
      await testSynchronizedCounters(page, '/test/zustand/vueGlobalState/');
    });
  });
});
