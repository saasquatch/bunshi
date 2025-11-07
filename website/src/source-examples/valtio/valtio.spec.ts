import { test, expect } from '@playwright/test';
import { testRecipeWithFramework } from '../../../tests/helpers/common-tests';

test.describe('Valtio Recipe', () => {
  test('React - should load valtio example', async ({ page }) => {
    const sandpack = await testRecipeWithFramework(page, 'valtio', 'React');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });

  test('Vue - should load valtio example', async ({ page }) => {
    const sandpack = await testRecipeWithFramework(page, 'valtio', 'Vue');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });
});
