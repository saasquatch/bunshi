# GitHub Copilot Instructions for Bunshi

## Project Overview

Bunshi is a tiny, fast, dependency-free library for creating state stores and dependencies. It supports React, Vue, and vanilla JavaScript/TypeScript. The core vanilla bundle is approximately 1.18kb.

## Coding Style

- Follow TypeScript strict mode rules as defined in `tsconfig.json`
- Use ESLint configuration from `.eslintrc.json` - particularly the `compat/compat` rule for browser compatibility
- Use modern ECMAScript features (esnext) as defined in the TypeScript config
- Follow existing code formatting conventions (use Prettier for formatting)
- Browser compatibility: Support Chrome 64+, Edge 79+, Firefox 67+, Opera 51+, Safari 12+ (as specified in browserslist)

## TypeScript Guidelines

- Enable strict type-checking (`strict: true` in tsconfig)
- Use `noImplicitReturns` and `noFallthroughCasesInSwitch` for stronger correctness
- Export types and interfaces for public APIs
- Use TypeScript 3.4+ compatible types (the project supports downleveling to ts3)
- Prefer ESM modules (`module: "esnext"`)

## Testing Requirements

- Use Vitest for all tests
- Test files should have `.test.ts` or `.test.tsx` extension
- Place tests alongside the source files they test
- Run tests with `npm run test:code` for unit tests
- Browser tests available for Chrome, Firefox, and Safari via `npm run test:browsers`
- Coverage is tracked with Vitest coverage (v8)
- Always create tests for new features and bug fixes
- For React components, use `@testing-library/react`
- For Vue components, use `@testing-library/vue`

## Build and Development

- **Install dependencies**: `npm install`
- **Build**: `npm run build` (builds code and typings using tsup)
- **Development mode**: `npm run dev` (watches for changes and runs tests)
- **Run tests**: `npm test` (runs all tests including code, typings, format, size, and browsers)
- **Format code**: `npm run format` (uses Prettier)
- **Check formatting**: `npm run test:format`
- **Lint**: `npm run test:eslint`
- **Size limit check**: `npm run test:size` (enforces bundle size limits)

## Project Structure

- `src/vanilla/` - Core vanilla JavaScript/TypeScript implementation
- `src/react/` - React bindings and hooks
- `src/vue/` - Vue composition API bindings
- `src/shared/` - Shared utilities and types
- `dist/` - Built distribution files (do not edit manually)
- `examples/` - Example projects demonstrating usage
- `website/` - Documentation website

## Module Exports

The project has three main entry points:
- `bunshi` (default) - Vanilla JS/TS exports
- `bunshi/react` - React-specific exports
- `bunshi/vue` - Vue-specific exports

Ensure any new exports are properly configured in `package.json` exports field and `tsup.config.ts`.

## Dependencies

- Keep the core library dependency-free
- React and Vue are peer dependencies (optional)
- Only add dev dependencies when absolutely necessary
- Check bundle size impact with `npm run test:size` after adding dependencies

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md using changesets (`npx changeset`)
- Documentation website is in the `website/` directory

## Pull Requests

- Keep PRs focused and avoid unrelated changes
- Create failing tests first, then implement fixes
- Ensure all tests pass before submitting
- Update PR template with accurate description
- Check browser compatibility with `npm run test:browsers`
- Verify bundle size limits with `npm run test:size`

## Performance Considerations

- The library has strict size limits (see `size-limit` config in package.json)
- Vanilla bundle must be under 3.6 KB
- React bundle must be under 4.4 KB
- Vue bundle must be under 4.1 KB
- Always consider bundle size impact when making changes

## Security

- Never commit secrets or credentials
- Validate external inputs appropriately
- Follow security best practices for state management
- Be mindful of XSS and injection vulnerabilities in user-provided data

## Migration from jotai-molecules

The project was formerly called `jotai-molecules`. When working with migration-related code:
- Import from `bunshi/react` instead of `jotai-molecules`
- The core API remains the same
- React is no longer the default export

## Changesets

- Use changesets for version management
- Run `npx changeset` to create a changeset for your PR
- Follow semantic versioning (major, minor, patch)
- Changesets are used in CI/CD for automated releases
