---
phase: quick-024
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "pnpm test:e2e runs to completion without infrastructure errors"
    - "All E2E test files execute (auth, chat, thread, model-selection, sidebar, sidekiq, workspace)"
    - "Any failing tests are either fixed or documented with a clear reason for skipping"
  artifacts: []
  key_links: []
---

<objective>
Run the full E2E test suite (`pnpm test:e2e`) in the sidekiq-webapp directory and fix any issues encountered.

Purpose: Validate that the E2E test suite passes after Phase 10 workspace schema migration and recent changes (quick-021 unit tests, quick-022 E2E test additions, quick-023 shiki fix).
Output: All E2E tests passing, or failing tests fixed with appropriate code changes committed.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@sidekiq-webapp/playwright.config.ts
@sidekiq-webapp/tests/e2e/auth.setup.ts
@sidekiq-webapp/tests/e2e/global-setup.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Run E2E test suite and diagnose failures</name>
  <files>sidekiq-webapp/tests/e2e/*.spec.ts, sidekiq-webapp/tests/e2e/*.setup.ts, sidekiq-webapp/tests/e2e/global-setup.ts</files>
  <action>
Run the E2E test suite from the sidekiq-webapp directory:

```bash
cd /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp && pnpm test:e2e
```

IMPORTANT: The E2E tests require:
1. A running dev server (playwright.config.ts has `webServer.command: "pnpm dev"` which auto-starts it)
2. A PostgreSQL database accessible via the connection string in .env
3. E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars set in .env for authenticated tests
4. Docker compose may need to be running for the local database

If the dev server fails to start or the database is unreachable, check:
- `docker compose up -d` may be needed for the local database
- The .env file has valid DATABASE_URL

Capture the full test output. For any failures:
1. Identify if the failure is infrastructure (DB down, server crash) vs test logic (selector mismatch, timing issue, stale assertion)
2. For infrastructure issues: fix the root cause (start services, fix env vars)
3. For test logic issues: read the failing test file and the corresponding app source to understand what changed
4. For timing issues: add appropriate waits or increase timeouts

Do NOT skip tests unless they are genuinely flaky due to external dependencies (e.g., AI API rate limits, which the sidekiq tests already handle with try/catch RATE_LIMITED patterns).
  </action>
  <verify>Review the test output. Count passed, failed, and skipped tests.</verify>
  <done>Full test output captured with clear understanding of which tests pass and which fail (and why).</done>
</task>

<task type="auto">
  <name>Task 2: Fix failing tests and re-run until green</name>
  <files>sidekiq-webapp/tests/e2e/*.spec.ts, sidekiq-webapp/src/**/*.tsx, sidekiq-webapp/src/**/*.ts</files>
  <action>
For each failing test identified in Task 1, apply the appropriate fix:

**Selector mismatches** (most common after Phase 10 refactor):
- Compare the test selector (getByText, getByRole, locator) against the actual rendered DOM
- Update selectors to match current UI text/structure
- Run the app locally and inspect elements if needed

**Timing issues:**
- Add `waitForLoadState("domcontentloaded")` or `waitForLoadState("networkidle")` where appropriate
- Use `expect(...).toBeVisible({ timeout: N })` with reasonable timeouts
- Avoid `waitForTimeout` unless absolutely necessary (prefer waiting for specific conditions)

**Stale assertions** (test expects old behavior):
- If the app behavior changed in Phase 10 (e.g., "Team" -> "Workspace" terminology), update test assertions
- If a UI element was removed or restructured, update the test to match current layout

**App bugs** (test is correct but app is broken):
- Fix the source code in the relevant component/route
- Keep fixes minimal and targeted

After fixing each issue, re-run the specific failing test file first:
```bash
pnpm test:e2e -- tests/e2e/{specific-file}.spec.ts
```

Then do a full re-run:
```bash
pnpm test:e2e
```

Iterate until all tests pass (or remaining failures are documented rate-limit skips).
  </action>
  <verify>`pnpm test:e2e` completes with all tests passing (except rate-limit skips which are expected).</verify>
  <done>All E2E tests pass. Any fixes are saved to the appropriate files. The test suite is green.</done>
</task>

</tasks>

<verification>
- `cd /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp && pnpm test:e2e` exits with code 0
- No test failures (rate-limit skips are acceptable)
- Any modified source files still pass `pnpm check` (lint + typecheck)
</verification>

<success_criteria>
- E2E test suite runs to completion
- All tests pass (excluding expected rate-limit skips)
- Any source code fixes maintain type safety and lint compliance
- Changes committed with descriptive conventional commit message
</success_criteria>

<output>
After completion, create `.planning/quick/024-run-pnpm-test-e2e-and-fix-any-issue-you-/024-SUMMARY.md`
</output>
