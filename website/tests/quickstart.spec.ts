import { test, expect } from '@playwright/test';
import { createSandpackHelper } from './helpers/sandpack';
import { testCounterIncrement, testMultipleCounters, testFormScopedCounters } from './helpers/common-tests';

test.describe('Quickstart Examples', () => {
  test.describe('Basic Counter Example', () => {
    test('React - should increment counter when button is clicked', async ({ page }) => {
      await page.goto('/concepts/quickstart/');
      
      // Wait for page to load and click on React tab
      await page.click('button[role="tab"]:has-text("React")');
      await page.waitForTimeout(1000);
      
      await testCounterIncrement(page);
    });

    test('Vue - should increment counter when button is clicked', async ({ page }) => {
      await page.goto('/concepts/quickstart/');
      
      // Click on Vue tab
      await page.click('button[role="tab"]:has-text("Vue")');
      await page.waitForTimeout(1000);
      
      await testCounterIncrement(page);
    });
  });

  test.describe('Globally Shared State', () => {
    test('React - multiple counters should share state globally', async ({ page }) => {
      await page.goto('/concepts/quickstart/');
      
      // Click on React tab
      await page.click('button[role="tab"]:has-text("React")');
      await page.waitForTimeout(1000);
      
      await testMultipleCounters(page, { shouldShareState: true });
    });

    test('Vue - multiple counters should share state globally', async ({ page }) => {
      await page.goto('/concepts/quickstart/');
      
      // Click on Vue tab
      await page.click('button[role="tab"]:has-text("Vue")');
      await page.waitForTimeout(1000);
      
      await testMultipleCounters(page, { shouldShareState: true });
    });
  });

  test.describe('Component Scoped State', () => {
    test('React - multiple counters should have separate component-scoped state', async ({ page }) => {
      await page.goto('/concepts/quickstart/');
      
      // Find and click the second "React" tab (in the component-scoped section)
      const reactTabs = await page.locator('button[role="tab"]:has-text("React")').all();
      if (reactTabs.length >= 2) {
        await reactTabs[1].click();
        await page.waitForTimeout(1000);
        
        await testMultipleCounters(page, { shouldShareState: false });
      }
    });

    test('Vue - multiple counters should have separate component-scoped state', async ({ page }) => {
      await page.goto('/concepts/quickstart/');
      
      // Find and click the second "Vue" tab (in the component-scoped section)
      const vueTabs = await page.locator('button[role="tab"]:has-text("Vue")').all();
      if (vueTabs.length >= 2) {
        await vueTabs[1].click();
        await page.waitForTimeout(1000);
        
        await testMultipleCounters(page, { shouldShareState: false });
      }
    });
  });

  test.describe('Form Scoped State', () => {
    test('React - counters should be scoped to their form', async ({ page }) => {
      await page.goto('/concepts/quickstart/');
      
      // Find and click the third "React" tab (in the form-scoped section)
      const reactTabs = await page.locator('button[role="tab"]:has-text("React")').all();
      if (reactTabs.length >= 3) {
        await reactTabs[2].click();
        await page.waitForTimeout(1000);
        
        await testFormScopedCounters(page);
      }
    });

    test('Vue - counters should be scoped to their form', async ({ page }) => {
      await page.goto('/concepts/quickstart/');
      
      // Find and click the third "Vue" tab (in the form-scoped section)
      const vueTabs = await page.locator('button[role="tab"]:has-text("Vue")').all();
      if (vueTabs.length >= 3) {
        await vueTabs[2].click();
        await page.waitForTimeout(1000);
        
        await testFormScopedCounters(page);
      }
    });
  });

  test.describe('Page Navigation', () => {
    test('should navigate to quickstart page and load examples', async ({ page }) => {
      await page.goto('/concepts/quickstart/');
      
      // Check page loaded
      await expect(page.locator('h1')).toContainText('Quick Start');
      
      // Check that we have sandpack containers
      const sandpackContainers = page.locator('[class*="sp-"]');
      await expect(sandpackContainers.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
