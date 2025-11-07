import { test, expect } from '@playwright/test';
import { testRecipeWithFramework } from '../../../tests/helpers/common-tests';

test.describe('Zag Recipe', () => {
  test('React - should load zag example', async ({ page }) => {
    const sandpack = await testRecipeWithFramework(page, 'zag', 'React');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });

  test('Vue - should load zag example', async ({ page }) => {
    const sandpack = await testRecipeWithFramework(page, 'zag', 'Vue');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });
});
