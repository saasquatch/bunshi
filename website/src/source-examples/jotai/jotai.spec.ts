import { test, expect } from '@playwright/test';
import { createSandpackHelper } from '../../../tests/helpers/sandpack';

test.describe('Jotai Recipe', () => {
  test('should load jotai example', async ({ page }) => {
    await page.goto('/recipes/jotai/');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText(/jotai/i);
    
    // Check sandpack loads
    const sandpack = createSandpackHelper(page);
    await sandpack.waitForSandpackIframe();
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });
});
