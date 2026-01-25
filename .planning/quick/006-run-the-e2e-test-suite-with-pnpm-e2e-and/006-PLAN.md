---
phase: quick
plan: 006
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "E2E test suite runs without failures"
    - "All sidekiq.spec.ts tests pass"
    - "All auth, chat, thread, sidebar, model-selection tests pass"
  artifacts:
    - path: "sidekiq-webapp/tests/e2e/*.spec.ts"
      provides: "E2E test files"
  key_links:
    - from: "playwright.config.ts"
      to: "tests/e2e/*.spec.ts"
      via: "Playwright test runner"
      pattern: "testDir.*tests/e2e"
---

<objective>
Run the complete E2E test suite using `pnpm test:e2e` and fix any test failures or issues encountered.

Purpose: Ensure the E2E test suite is passing after recent Phase 6 E2E test additions (quick-005).
Output: All E2E tests passing, any fixes committed.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@sidekiq-webapp/playwright.config.ts
@sidekiq-webapp/tests/e2e/sidekiq.spec.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Run E2E test suite and identify failures</name>
  <files>sidekiq-webapp/tests/e2e/*.spec.ts</files>
  <action>
    Run the E2E test suite from the sidekiq-webapp directory:
    1. cd sidekiq-webapp
    2. Run `pnpm test:e2e` to execute all Playwright tests
    3. Observe the output for any test failures, timeouts, or errors
    4. Note which specific test files and test cases are failing
    5. Capture error messages and stack traces for debugging

    The test suite includes:
    - auth.spec.ts (unauthenticated tests)
    - chat.spec.ts (authenticated, requires auth.setup.ts)
    - thread.spec.ts (authenticated)
    - model-selection.spec.ts (authenticated)
    - sidebar.spec.ts (authenticated)
    - sidekiq.spec.ts (authenticated, serial mode due to rate limiting)

    If tests fail due to missing auth state, ensure auth.setup.ts runs first.
    If tests fail due to server not running, Playwright should auto-start via webServer config.
  </action>
  <verify>Capture full test output including pass/fail counts and error details</verify>
  <done>E2E test run completed with clear list of any failures</done>
</task>

<task type="auto">
  <name>Task 2: Fix identified test failures</name>
  <files>sidekiq-webapp/tests/e2e/*.spec.ts</files>
  <action>
    For each failing test identified in Task 1:
    1. Analyze the error message and stack trace
    2. Determine root cause (selector issue, timing issue, missing element, API error, etc.)
    3. Apply appropriate fix:
       - Selector issues: Update locators to match current DOM structure
       - Timing issues: Add appropriate waitFor calls or increase timeouts
       - Missing elements: Check if UI component exists and update test expectations
       - API errors: Check if backend is responding correctly
    4. Re-run the specific failing test to verify fix: `pnpm test:e2e --grep "test name"`

    Common fixes:
    - Replace brittle selectors with role-based or data-testid selectors
    - Add waitForLoadState('networkidle') or waitForTimeout for async operations
    - Use expect with toBeVisible() before interacting with elements
    - Handle flaky tests with test.retry or more robust waiting strategies

    If no failures in Task 1, this task is a no-op.
  </action>
  <verify>Run `pnpm test:e2e` again to confirm all tests pass</verify>
  <done>All E2E tests pass with 0 failures</done>
</task>

<task type="auto">
  <name>Task 3: Commit fixes (if any)</name>
  <files>sidekiq-webapp/tests/e2e/*.spec.ts</files>
  <action>
    If any fixes were made in Task 2:
    1. Stage the modified test files
    2. Commit with message: "fix(e2e): resolve test failures in E2E suite"

    If no fixes were needed (all tests passed in Task 1):
    1. No commit needed
    2. Log "All E2E tests passed without modifications"
  </action>
  <verify>git status shows clean working tree (if committed) or unchanged files (if no fixes)</verify>
  <done>E2E test fixes committed or confirmed no fixes needed</done>
</task>

</tasks>

<verification>
- `pnpm test:e2e` exits with code 0
- All test files show green/passing status
- No flaky tests (run twice if needed to confirm stability)
</verification>

<success_criteria>
- E2E test suite completes successfully with 0 failures
- Any broken tests are fixed and committed
- Test stability confirmed (no flaky tests)
</success_criteria>

<output>
After completion, create `.planning/quick/006-run-the-e2e-test-suite-with-pnpm-e2e-and/006-SUMMARY.md`
</output>
