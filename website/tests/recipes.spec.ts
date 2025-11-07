import { test, expect } from '@playwright/test';
import { createSandpackHelper } from './helpers/sandpack';

test.describe('Recipe Examples', () => {
  // Helper function to test a basic recipe example
  async function testRecipeExample(page: any, recipeName: string, frameworkTab?: string) {
    await page.goto(`/recipes/${recipeName}/`);
    
    if (frameworkTab) {
      await page.click(`button[role="tab"]:has-text("${frameworkTab}")`);
      await page.waitForTimeout(1000);
    }
    
    const sandpack = createSandpackHelper(page);
    
    // Wait for sandpack to load
    await sandpack.waitForSandpackIframe(30000);
    
    // Basic check that content loads
    const iframe = await sandpack.waitForSandpackIframe();
    const body = iframe.locator('body');
    await expect(body).toBeVisible({ timeout: 15000 });
    
    return sandpack;
  }

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

  test.describe('Nanostores Recipe', () => {
    test('React - should load nanostores example', async ({ page }) => {
      const sandpack = await testRecipeExample(page, 'nanostores', 'React');
      const hasContent = await sandpack.hasElement('body');
      expect(hasContent).toBe(true);
    });

    test('Vue - should load nanostores example', async ({ page }) => {
      const sandpack = await testRecipeExample(page, 'nanostores', 'Vue');
      const hasContent = await sandpack.hasElement('body');
      expect(hasContent).toBe(true);
    });
  });

  test.describe('Valtio Recipe', () => {
    test('React - should load valtio example', async ({ page }) => {
      const sandpack = await testRecipeExample(page, 'valtio', 'React');
      const hasContent = await sandpack.hasElement('body');
      expect(hasContent).toBe(true);
    });

    test('Vue - should load valtio example', async ({ page }) => {
      const sandpack = await testRecipeExample(page, 'valtio', 'Vue');
      const hasContent = await sandpack.hasElement('body');
      expect(hasContent).toBe(true);
    });
  });

  test.describe('XState Recipe', () => {
    test('React - should load xstate example', async ({ page }) => {
      const sandpack = await testRecipeExample(page, 'xstate', 'React');
      const hasContent = await sandpack.hasElement('body');
      expect(hasContent).toBe(true);
    });

    test('Vue - should load xstate example', async ({ page }) => {
      const sandpack = await testRecipeExample(page, 'xstate', 'Vue');
      const hasContent = await sandpack.hasElement('body');
      expect(hasContent).toBe(true);
    });
  });

  test.describe('Zag Recipe', () => {
    test('React - should load zag example', async ({ page }) => {
      const sandpack = await testRecipeExample(page, 'zag', 'React');
      const hasContent = await sandpack.hasElement('body');
      expect(hasContent).toBe(true);
    });

    test('Vue - should load zag example', async ({ page }) => {
      const sandpack = await testRecipeExample(page, 'zag', 'Vue');
      const hasContent = await sandpack.hasElement('body');
      expect(hasContent).toBe(true);
    });
  });

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

  test.describe('Page Navigation', () => {
    test('should navigate to recipe pages', async ({ page }) => {
      const recipes = ['jotai', 'nanostores', 'valtio', 'xstate', 'zag', 'zustand', 'vue-ref'];
      
      for (const recipe of recipes) {
        await page.goto(`/recipes/${recipe}/`);
        
        // Check that sandpack containers exist
        const sandpackContainers = page.locator('[class*="sp-"]');
        const count = await sandpackContainers.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });
});
