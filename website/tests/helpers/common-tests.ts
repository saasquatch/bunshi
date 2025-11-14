import { expect, type Page } from '@playwright/test';
import { createSandpackHelper } from './sandpack';

/**
 * Common test patterns for counter examples
 */
export async function testCounterIncrement(page: Page, buttonSelector = 'button') {
  const sandpack = createSandpackHelper(page);
  
  // Get initial count text
  const initialText = await sandpack.getPreviewText('p');
  expect(initialText).toContain('Clicks: 0');
  
  // Click increment button
  await sandpack.clickInPreview(buttonSelector);
  
  // Wait a bit for state to update
  await page.waitForTimeout(500);
  
  // Check count increased
  const updatedText = await sandpack.getPreviewText('p');
  expect(updatedText).toContain('Clicks: 1');
}

/**
 * Test multiple counters sharing or not sharing state
 */
export async function testMultipleCounters(
  page: Page, 
  options: {
    shouldShareState: boolean,
    counterCount?: number,
    buttonSelector?: string,
    counterSelector?: string
  }
) {
  const { shouldShareState, counterCount = 2, buttonSelector = 'button', counterSelector = 'p' } = options;
  const sandpack = createSandpackHelper(page);
  
  // Verify we have multiple counters
  const count = await sandpack.countElements(counterSelector);
  expect(count).toBe(counterCount);
  
  // Get all initial counter texts
  const initialTexts = await sandpack.getAllTexts(counterSelector);
  initialTexts.forEach(text => {
    expect(text).toContain('Clicks: 0');
  });
  
  // Click first button
  const buttons = (await sandpack.waitForSandpackIframe()).locator(buttonSelector);
  await buttons.first().click();
  
  // Wait for state update
  await page.waitForTimeout(500);
  
  // Check counter values
  const updatedTexts = await sandpack.getAllTexts(counterSelector);
  
  if (shouldShareState) {
    // Both counters should show 1
    updatedTexts.forEach(text => {
      expect(text).toContain('Clicks: 1');
    });
  } else {
    // Only first counter should show 1, second should still be 0
    expect(updatedTexts[0]).toContain('Clicks: 1');
    expect(updatedTexts[1]).toContain('Clicks: 0');
  }
}

/**
 * Test form-scoped counters
 */
export async function testFormScopedCounters(page: Page) {
  const sandpack = createSandpackHelper(page);
  
  // Look for multiple forms
  const iframe = await sandpack.waitForSandpackIframe();
  const forms = iframe.locator('form, [data-form], div[class*="form"]');
  const formCount = await forms.count();
  
  if (formCount >= 2) {
    // Get buttons in first form
    const firstFormButtons = forms.first().locator('button');
    const firstFormCounters = forms.first().locator('p');
    
    // Get buttons in second form
    const secondFormButtons = forms.nth(1).locator('button');
    const secondFormCounters = forms.nth(1).locator('p');
    
    // Click button in first form
    await firstFormButtons.first().click();
    await page.waitForTimeout(500);
    
    // Check first form counters updated (they should share state within form)
    const firstFormCount = await firstFormCounters.count();
    for (let i = 0; i < firstFormCount; i++) {
      const text = await firstFormCounters.nth(i).textContent();
      expect(text).toContain('Clicks: 1');
    }
    
    // Check second form counters stayed at 0 (different form scope)
    const secondFormCount = await secondFormCounters.count();
    for (let i = 0; i < secondFormCount; i++) {
      const text = await secondFormCounters.nth(i).textContent();
      expect(text).toContain('Clicks: 0');
    }
  }
}

/**
 * Test lifecycle mounting/unmounting
 */
export async function testLifecycleToggle(page: Page) {
  const sandpack = createSandpackHelper(page);
  
  // Look for toggle button
  const iframe = await sandpack.waitForSandpackIframe();
  const toggleButton = iframe.locator('button:has-text("Toggle"), button:has-text("Show"), button:has-text("Hide")').first();
  
  await toggleButton.waitFor({ state: 'visible', timeout: 10000 });
  
  // Count initial counters
  const initialCount = await sandpack.countElements('p:has-text("Clicks:")');
  
  // Click toggle to hide
  await toggleButton.click();
  await page.waitForTimeout(500);
  
  // Count counters after toggle
  const afterToggleCount = await sandpack.countElements('p:has-text("Clicks:")');
  
  // Should be different (either more or less counters visible)
  expect(afterToggleCount).not.toBe(initialCount);
  
  // Toggle back
  await toggleButton.click();
  await page.waitForTimeout(500);
  
  // Should be back to initial count
  const finalCount = await sandpack.countElements('p:has-text("Clicks:")');
  expect(finalCount).toBe(initialCount);
}
