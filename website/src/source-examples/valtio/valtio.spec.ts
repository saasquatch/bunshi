import { test, expect } from '@playwright/test';
import { createSandpackHelper } from '../../../tests/helpers/sandpack';

/**
 * Helper function to test a valtio example
 */
async function testValtioExample(page: any, frameworkTab: string) {
  await page.goto('/recipes/valtio/');
  
  await page.click(`button[role="tab"]:has-text("${frameworkTab}")`);
  await page.waitForTimeout(1000);
  
  const sandpack = createSandpackHelper(page);
  
  // Wait for sandpack to load
  await sandpack.waitForSandpackIframe(30000);
  
  // Basic check that content loads
  const iframe = await sandpack.waitForSandpackIframe();
  const body = iframe.locator('body');
  await expect(body).toBeVisible({ timeout: 15000 });
  
  return sandpack;
}

test.describe('Valtio Recipe', () => {
  test('React - should load valtio example', async ({ page }) => {
    const sandpack = await testValtioExample(page, 'React');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });

  test('Vue - should load valtio example', async ({ page }) => {
    const sandpack = await testValtioExample(page, 'Vue');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });
});
