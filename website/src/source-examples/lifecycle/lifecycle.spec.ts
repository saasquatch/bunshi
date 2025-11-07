import { test, expect } from '@playwright/test';
import { createSandpackHelper } from '../../../tests/helpers/sandpack';
import { testLifecycleToggle } from '../../../tests/helpers/common-tests';

test.describe('Lifecycle Examples', () => {
  test.describe('React Lifecycle', () => {
    test('React - should mount and unmount counters correctly', async ({ page }) => {
      await page.goto('/concepts/lifecycle/');
      
      // Wait for page to load and click on React tab
      await page.click('button[role="tab"]:has-text("React")');
      await page.waitForTimeout(1000);
      
      await testLifecycleToggle(page);
    });

    test('React - should show counter functionality', async ({ page }) => {
      await page.goto('/concepts/lifecycle/');
      
      await page.click('button[role="tab"]:has-text("React")');
      await page.waitForTimeout(1000);
      
      const sandpack = createSandpackHelper(page);
      
      // Check if counters exist
      const hasCounters = await sandpack.hasElement('p:has-text("Clicks:")');
      expect(hasCounters).toBe(true);
      
      // Try to increment counter
      const buttons = (await sandpack.waitForSandpackIframe()).locator('button:has-text("Increment"), button:has-text("+")');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        await buttons.first().click();
        await page.waitForTimeout(500);
        
        // Check counter increased
        const text = await sandpack.getPreviewText('p:has-text("Clicks:")');
        expect(text).toMatch(/Clicks:\s*[1-9]/);
      }
    });
  });

  test.describe('React Strict Mode', () => {
    test('React (Strict) - should handle strict mode correctly', async ({ page }) => {
      await page.goto('/concepts/lifecycle/');
      
      // Find and click the "React (Strict)" tab
      await page.click('button[role="tab"]:has-text("React (Strict)")');
      await page.waitForTimeout(1000);
      
      const sandpack = createSandpackHelper(page);
      
      // Check if counters exist
      const hasCounters = await sandpack.hasElement('p:has-text("Clicks:")');
      expect(hasCounters).toBe(true);
    });
  });

  test.describe('Vue Lifecycle', () => {
    test('Vue - should mount and unmount counters correctly', async ({ page }) => {
      await page.goto('/concepts/lifecycle/');
      
      await page.click('button[role="tab"]:has-text("Vue")');
      await page.waitForTimeout(1000);
      
      await testLifecycleToggle(page);
    });

    test('Vue - should show counter functionality', async ({ page }) => {
      await page.goto('/concepts/lifecycle/');
      
      await page.click('button[role="tab"]:has-text("Vue")');
      await page.waitForTimeout(1000);
      
      const sandpack = createSandpackHelper(page);
      
      // Check if counters exist
      const hasCounters = await sandpack.hasElement('p:has-text("Clicks:")');
      expect(hasCounters).toBe(true);
      
      // Try to increment counter
      const buttons = (await sandpack.waitForSandpackIframe()).locator('button:has-text("Increment"), button:has-text("+")');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        await buttons.first().click();
        await page.waitForTimeout(500);
        
        // Check counter increased
        const text = await sandpack.getPreviewText('p:has-text("Clicks:")');
        expect(text).toMatch(/Clicks:\s*[1-9]/);
      }
    });
  });

  test.describe('Page Navigation', () => {
    test('should navigate to lifecycle page and load examples', async ({ page }) => {
      await page.goto('/concepts/lifecycle/');
      
      // Check page loaded
      await expect(page.locator('h1')).toContainText('Lifecycle');
      
      // Check that we have sandpack containers
      const sandpackContainers = page.locator('[class*="sp-"]');
      await expect(sandpackContainers.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
