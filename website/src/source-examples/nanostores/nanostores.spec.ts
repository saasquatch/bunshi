import { test, expect } from '@playwright/test';
import { testRecipeWithFramework } from '../../../tests/helpers/common-tests';

test.describe('Nanostores Recipe', () => {
  test('React - should load nanostores example', async ({ page }) => {
    const sandpack = await testRecipeWithFramework(page, 'nanostores', 'React');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });

  test('Vue - should load nanostores example', async ({ page }) => {
    const sandpack = await testRecipeWithFramework(page, 'nanostores', 'Vue');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });
});
