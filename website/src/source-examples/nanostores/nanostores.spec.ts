import { test, expect } from '@playwright/test';
import { createSandpackHelper } from '../../../tests/helpers/sandpack';

/**
 * Helper function to test a nanostores example
 */
async function testNanostoresExample(page: any, frameworkTab: string) {
  await page.goto('/recipes/nanostores/');
  
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

test.describe('Nanostores Recipe', () => {
  test('React - should load nanostores example', async ({ page }) => {
    const sandpack = await testNanostoresExample(page, 'React');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });

  test('Vue - should load nanostores example', async ({ page }) => {
    const sandpack = await testNanostoresExample(page, 'Vue');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });
});
