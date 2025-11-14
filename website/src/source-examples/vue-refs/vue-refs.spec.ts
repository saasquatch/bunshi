import { test, expect } from '@playwright/test';
import { createSandpackHelper } from '../../../tests/helpers/sandpack';

test.describe('Vue Refs Recipe', () => {
  test('should load vue-ref example', async ({ page }) => {
    await page.goto('/recipes/vue-ref/');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText(/vue/i);
    
    // Check sandpack loads
    const sandpack = createSandpackHelper(page);
    await sandpack.waitForSandpackIframe();
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });
});
