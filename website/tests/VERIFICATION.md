# Website Testing - Verification

This document provides verification that the Playwright test infrastructure is correctly set up.

## Test Structure Verification

### ✅ Package Configuration
- `@playwright/test` dependency added to `package.json`
- Test scripts configured (`test`, `test:headed`, `test:ui`)
- Version: ^1.48.0

### ✅ Playwright Configuration
- Configuration file: `playwright.config.ts`
- Dev server integration configured
- Multiple browser projects (Chromium, Firefox, WebKit)
- Automatic server startup with `reuseExistingServer` for local development
- Trace collection on failures
- HTML reporter configured

### ✅ Test Files Created
Tests are co-located with source code in `src/source-examples/`:
- `tests/helpers/sandpack.ts` - Sandpack iframe interaction utilities
- `tests/helpers/common-tests.ts` - Shared test patterns
- `src/source-examples/quickstart/quickstart.spec.ts` - Quickstart example tests (12 tests)
- `src/source-examples/lifecycle/lifecycle.spec.ts` - Lifecycle example tests (8 tests)
- `src/source-examples/jotai/jotai.spec.ts` - Jotai recipe tests (1 test)
- `src/source-examples/nanostores/nanostores.spec.ts` - Nanostores recipe tests (2 tests)
- `src/source-examples/valtio/valtio.spec.ts` - Valtio recipe tests (2 tests)
- `src/source-examples/xstate/xstate.spec.ts` - XState recipe tests (2 tests)
- `src/source-examples/zag/zag.spec.ts` - Zag recipe tests (2 tests)
- `src/source-examples/zustand/zustand.spec.ts` - Zustand recipe tests (1 test)
- `src/source-examples/vue-refs/vue-refs.spec.ts` - Vue Refs recipe tests (1 test)
- **Total: 31 tests covering React and Vue examples**

### ✅ GitHub Actions Integration
- PR validation workflow updated with website test job
- Deployment workflow updated with test job before deploy
- Proper browser installation steps included

### ✅ Test Coverage

#### Quickstart Examples
- Basic counter increment (React & Vue)
- Globally shared state (React & Vue)
- Component-scoped state (React & Vue)
- Form-scoped state (React & Vue)
- Page navigation and loading

#### Lifecycle Examples
- Mount/unmount behavior (React & Vue)
- Counter functionality (React & Vue)
- React Strict Mode handling
- Page navigation and loading

#### Recipe Examples
- Jotai integration
- Nanostores integration (React & Vue)
- Valtio integration (React & Vue)
- XState integration (React & Vue)
- Zag integration (React & Vue)
- Zustand integration
- Vue refs integration
- Page navigation for all recipes

## Test Helpers

### SandpackHelper Class
Provides methods to interact with Sandpack iframes:
- `waitForSandpackIframe()` - Wait for iframe to load
- `getPreviewText(selector)` - Get text from iframe element
- `clickInPreview(selector)` - Click element in iframe
- `hasElement(selector)` - Check if element exists
- `countElements(selector)` - Count matching elements
- `getAllTexts(selector)` - Get all text contents
- `waitForText(selector, text)` - Wait for specific text
- `getInputValue(selector)` - Get input value
- `typeInInput(selector, text)` - Type into input

### Common Test Functions
Reusable test patterns:
- `testCounterIncrement(page)` - Test basic counter increment
- `testMultipleCounters(page, options)` - Test shared/scoped state
- `testFormScopedCounters(page)` - Test form-scoped state
- `testLifecycleToggle(page)` - Test mount/unmount behavior

## CI/CD Configuration

### validate-pr.yml
```yaml
- name: Install website dependencies
  run: cd website && npm install

- name: Install Playwright Browsers
  run: cd website && npx playwright install --with-deps

- name: Run Playwright tests
  run: cd website && npm test
```

### website.yml
```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - Install dependencies
    - Install Playwright browsers
    - Run tests
    - Upload test results

build:
  needs: test  # Runs after tests pass
```

## Local Development

### Quick Start
```bash
cd website
npm install
npx playwright install --with-deps
npm test
```

### Development Mode
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm test
```

### Debugging
```bash
# Run with visible browser
npm run test:headed

# Run in UI mode
npm run test:ui

# Run specific test
npx playwright test quickstart.spec.ts

# Run specific browser
npx playwright test --project=chromium
```

## Test Execution Flow

1. **Pre-test**: Playwright starts Astro dev server (if not running)
2. **Navigation**: Tests navigate to specific pages (e.g., `/concepts/quickstart/`)
3. **Framework Selection**: Tests click on React/Vue tabs as needed
4. **Sandpack Wait**: Tests wait for Sandpack iframe to load
5. **Interaction**: Tests interact with elements inside the iframe
6. **Assertions**: Tests verify expected behavior
7. **Post-test**: Server keeps running for next test (reused)

## Example Test Flow

```typescript
test('React counter increment', async ({ page }) => {
  // Navigate to page
  await page.goto('/concepts/quickstart/');
  
  // Select framework tab
  await page.click('button[role="tab"]:has-text("React")');
  
  // Wait for Sandpack
  const sandpack = createSandpackHelper(page);
  const iframe = await sandpack.waitForSandpackIframe();
  
  // Interact with example
  await sandpack.clickInPreview('button');
  
  // Verify behavior
  const text = await sandpack.getPreviewText('p');
  expect(text).toContain('Clicks: 1');
});
```

## Known Issues & Limitations

### Browser Installation
- Playwright browser installation may fail in some environments
- CI uses `--with-deps` flag for system dependencies
- Local development may require manual browser installation

### Sandpack Timing
- Sandpack iframes take time to load (2-30 seconds)
- Tests include appropriate wait times
- Network speed affects loading times

### Framework Tabs
- Some pages have multiple sets of tabs
- Tests use array indexing to select the correct tab
- Tab order must remain consistent for tests to work

## Success Criteria

✅ Test infrastructure is complete and properly configured  
✅ Helper utilities provide clean abstraction for Sandpack interaction  
✅ Tests cover all major examples (React & Vue)  
✅ Shared code between React and Vue tests where possible  
✅ CI/CD integration ensures tests run automatically  
✅ Documentation provides clear guidance for developers  
✅ Tests can be run locally against dev server  

## Next Steps for Manual Verification

1. Install Playwright browsers: `npx playwright install --with-deps`
2. Start dev server: `npm run dev`
3. Run tests: `npm test`
4. View report: `npx playwright show-report`
5. Check CI: Push changes and verify tests run in GitHub Actions
