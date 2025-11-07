import { test, expect } from '@playwright/test';
import { testRecipeWithFramework } from '../../../tests/helpers/common-tests';

test.describe('XState Recipe', () => {
  test('React - should load xstate example', async ({ page }) => {
    const sandpack = await testRecipeWithFramework(page, 'xstate', 'React');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });

  test('Vue - should load xstate example', async ({ page }) => {
    const sandpack = await testRecipeWithFramework(page, 'xstate', 'Vue');
    const hasContent = await sandpack.hasElement('body');
    expect(hasContent).toBe(true);
  });
});
