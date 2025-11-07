import { test, expect } from '@playwright/test';
import { createSandpackHelper } from '../../../tests/helpers/sandpack';

/**
 * This test suite verifies that the Jotai examples in this directory work correctly.
 * 
 * The code under test is actually:
 * 
 *  - App.tsx
 *  - App.vue
 * 
 * However we are testing both these examples full stack using Playwright
 * to test they work with SandPack in the Astro docs site.
 * 
 */
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

    // TODO: Verify the behaviour of the counters
  });
});
