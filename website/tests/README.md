# Website Playwright Tests

This directory contains end-to-end tests for the Bunshi website examples using Playwright.

## Overview

The tests focus on validating that the interactive code examples embedded in the documentation work correctly. These examples use [Sandpack](https://sandpack.codesandbox.io/) to provide live, editable code examples that run in an iframe.

## Test Structure

```
tests/
├── helpers/
│   ├── sandpack.ts         # Utilities for interacting with Sandpack iframes
│   └── common-tests.ts     # Shared test patterns for common scenarios
├── quickstart.spec.ts      # Tests for quickstart examples
├── lifecycle.spec.ts       # Tests for lifecycle examples
└── recipes.spec.ts         # Tests for recipe examples (jotai, zustand, etc.)
```

## Running Tests

### Prerequisites

```bash
npm install
```

### Run all tests

```bash
npm test
```

### Run tests in headed mode (see the browser)

```bash
npm run test:headed
```

### Run tests in UI mode (interactive)

```bash
npm run test:ui
```

### Run specific test file

```bash
npx playwright test quickstart.spec.ts
```

### Run tests for specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Local Development

The tests are configured to start the Astro dev server automatically before running tests. The server will be reused if it's already running, making local development faster.

To manually start the dev server:

```bash
npm run dev
```

Then run tests in another terminal:

```bash
npm test
```

## Test Coverage

### Quickstart Examples (`/concepts/quickstart/`)
- ✅ Basic counter increment functionality
- ✅ Globally shared state between components
- ✅ Component-scoped state (separate state per component)
- ✅ Form-scoped state (state shared within form boundary)
- ✅ Tests for both React and Vue implementations

### Lifecycle Examples (`/concepts/lifecycle/`)
- ✅ Mount/unmount behavior
- ✅ Counter functionality
- ✅ React Strict Mode handling
- ✅ Tests for both React and Vue implementations

### Recipe Examples (`/recipes/*`)
- ✅ Jotai integration
- ✅ Nanostores integration (React & Vue)
- ✅ Valtio integration (React & Vue)
- ✅ XState integration (React & Vue)
- ✅ Zag integration (React & Vue)
- ✅ Zustand integration
- ✅ Vue refs integration

## Writing New Tests

### Testing Sandpack Examples

Use the `SandpackHelper` class to interact with Sandpack iframes:

```typescript
import { createSandpackHelper } from './helpers/sandpack';

test('my test', async ({ page }) => {
  await page.goto('/my-page/');
  
  const sandpack = createSandpackHelper(page);
  
  // Wait for iframe and get text
  const text = await sandpack.getPreviewText('p');
  
  // Click button in iframe
  await sandpack.clickInPreview('button');
  
  // Check element exists
  const hasElement = await sandpack.hasElement('div.counter');
});
```

### Using Common Test Patterns

For common scenarios like counter tests, use the helper functions:

```typescript
import { testCounterIncrement, testMultipleCounters } from './helpers/common-tests';

test('counter increment', async ({ page }) => {
  await page.goto('/my-page/');
  await testCounterIncrement(page);
});

test('shared state', async ({ page }) => {
  await page.goto('/my-page/');
  await testMultipleCounters(page, { shouldShareState: true });
});
```

### Framework-specific Tests

When testing examples that exist in both React and Vue:

```typescript
test.describe('My Example', () => {
  test('React - description', async ({ page }) => {
    await page.goto('/my-page/');
    await page.click('button[role="tab"]:has-text("React")');
    // ... test logic
  });
  
  test('Vue - description', async ({ page }) => {
    await page.goto('/my-page/');
    await page.click('button[role="tab"]:has-text("Vue")');
    // ... test logic
  });
});
```

## CI/CD Integration

The tests run automatically in GitHub Actions:

- **Pull Requests**: Tests run on every PR to validate changes
- **Main Branch**: Tests run before deploying the website to GitHub Pages

Test results and reports are uploaded as artifacts and can be viewed in the Actions tab.

## Troubleshooting

### Tests timeout waiting for Sandpack

- Sandpack can take time to load, especially on slower CI runners
- The default timeout is 30 seconds, which should be sufficient
- Check that the iframe selector is correct
- Verify the page loaded correctly before waiting for Sandpack

### Element not found in iframe

- Make sure you're using the iframe locator, not the main page locator
- Add appropriate wait times for dynamic content
- Check browser console for errors in the preview

### Tests pass locally but fail in CI

- CI uses headless mode by default
- Timing issues may be more apparent in CI
- Check the uploaded test artifacts for screenshots and traces
- Consider adding longer timeouts or more explicit waits

## Configuration

Test configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:4321` (Astro dev server)
- **Browsers**: Chromium, Firefox, WebKit
- **Timeouts**: 30s for Sandpack loading, 10s for general operations
- **Retries**: 2 retries on CI, 0 locally
- **Web Server**: Automatically starts Astro dev server

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Sandpack Documentation](https://sandpack.codesandbox.io/)
- [Astro Documentation](https://docs.astro.build/)
