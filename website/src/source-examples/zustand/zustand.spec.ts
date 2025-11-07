import { test, expect } from '@playwright/test';
import { createSandpackHelper } from '../../../tests/helpers/sandpack';

test.describe('Zustand Recipe', () => {
  test('should load zustand example', async ({ page }) => {
    await page.goto('/recipes/zustand/');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText(/zustand/i);
    
    // Check sandpack loads
    const sandpack = createSandpackHelper(page);
    await sandpack.waitForSandpackIframe();
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });
});
