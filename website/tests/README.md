# Website Playwright Tests

Playwright tests check that the interactive [Sandpack](https://sandpack.codesandbox.io/) examples on the docs site actually work, by driving the preview iframe that runs on codesandbox.io.

Specs are co-located with the examples in `src/source-examples/<category>/<category>.spec.ts`. They open the `/test/<category>/<example>/` pages, which render the same `examples.code.ts` configs as the docs. Conventions for adding examples and specs live in [`src/source-examples/README.md`](../src/source-examples/README.md).

Shared helpers live here:

- `helpers/sandpack.ts`: `sandpackPreview()` locates the preview iframe, and `SANDBOX_BOOT_TIMEOUT` sizes the wait for it to boot.
- `helpers/counter-recipe.ts`: `describeCounterRecipe()` holds the shared component-state vs. global-state tests for the standard counter examples.

## Running

```bash
npm install
npx playwright install --with-deps chromium

npm test                     # all specs (starts `astro dev`, or reuses a running one)
npm test -- zustand          # one category
npm run test:headed          # watch the browser
npm run test:ui              # interactive UI mode
npx playwright show-report   # open the last HTML report
```

## CI

`.github/workflows/website-test.yml` runs the suite on pull requests that touch `website/**`, and before every GitHub Pages deploy (`website.yml`). The HTML report is uploaded as the `playwright-report` artifact.
