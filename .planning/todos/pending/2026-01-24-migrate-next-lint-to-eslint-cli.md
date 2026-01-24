---
created: 2026-01-24T08:28
title: Migrate next lint to ESLint CLI
area: tooling
files:
  - package.json
  - .eslintrc.json
---

## Problem

`next lint` is deprecated and will be removed in Next.js 16. Currently getting this warning on app startup:

```
`next lint` is deprecated and will be removed in Next.js 16.
For new projects, use create-next-app to choose your preferred linter.
For existing projects, migrate to the ESLint CLI:
npx @next/codemod@canary next-lint-to-eslint-cli .
```

This needs to be addressed before upgrading to Next.js 16 to avoid build failures.

## Solution

Run the migration codemod:
```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

This will:
1. Update package.json lint scripts to use ESLint CLI directly
2. Migrate any Next.js-specific ESLint config to standard ESLint format
3. Ensure CI/CD and pre-commit hooks continue working
