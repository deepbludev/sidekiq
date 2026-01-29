---
phase: quick-026
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/e2e/workspace.spec.ts
autonomous: true

must_haves:
  truths:
    - "Existing E2E tests pass after Phase 11 workspace authorization changes"
    - "Workspace authorization E2E tests validate workspace-scoped data isolation"
    - "Workspace localStorage persistence is tested for E2E scenarios"
  artifacts:
    - path: "sidekiq-webapp/tests/e2e/workspace.spec.ts"
      provides: "Updated workspace E2E tests with Phase 11 authorization coverage"
  key_links:
    - from: "sidekiq-webapp/tests/e2e/workspace.spec.ts"
      to: "localStorage sidekiq-active-workspace-id"
      via: "addInitScript localStorage setup"
      pattern: "sidekiq-active-workspace-id"
---

<objective>
Update the E2E test suite to cover Phase 11 (Workspace Authorization) features, then run the full suite and fix any failures.

Purpose: Phase 11 introduced workspace-scoped data isolation via workspaceProcedure middleware, x-workspace-id header injection from localStorage, and query invalidation on workspace switch. The E2E tests need to validate these behaviors work end-to-end in the browser.

Output: Updated workspace.spec.ts with new authorization tests, all E2E tests passing.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/11-workspace-authorization/11-01-SUMMARY.md
@.planning/phases/11-workspace-authorization/11-02-SUMMARY.md
@.planning/phases/11-workspace-authorization/11-03-SUMMARY.md
@sidekiq-webapp/tests/e2e/workspace.spec.ts
@sidekiq-webapp/tests/e2e/auth.setup.ts
@sidekiq-webapp/tests/e2e/global-setup.ts
@sidekiq-webapp/playwright.config.ts
@sidekiq-webapp/src/features/workspace/hooks/use-active-workspace.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Phase 11 workspace authorization E2E tests to workspace.spec.ts</name>
  <files>sidekiq-webapp/tests/e2e/workspace.spec.ts</files>
  <action>
Add new test describe blocks to workspace.spec.ts covering Phase 11 workspace authorization features. Keep all existing Phase 10 tests intact. Add the following new test sections:

**1. "Workspace Data Isolation" test.describe:**
- Test "should show threads in personal workspace by default": Navigate to /chat, ensure sidebar starts expanded (remove sidebar-panel-collapsed from localStorage). Verify the thread list area is visible in the sidebar (search input for conversations). The point is that with no explicit workspace set, the personal workspace fallback works and data loads.
- Test "should show sidekiqs in personal workspace by default": Navigate to /sidekiqs, verify the sidebar shows the Sidekiqs panel heading (h2) and either sidekiq items or empty state loads. This validates the personal workspace fallback path for sidekiq data.

**2. "Workspace Header Injection" test.describe:**
- Test "should persist workspace selection in localStorage": Use page.addInitScript to set localStorage key "sidekiq-active-workspace-id" to a test value (e.g., "test-workspace-id-123"). Navigate to /chat. Use page.evaluate to read back the localStorage value and assert it equals the set value. This validates the localStorage key name matches what the app reads.
- Test "should clear workspace selection from localStorage": Use page.addInitScript to set "sidekiq-active-workspace-id" to a value, then navigate to /chat. Use page.evaluate to remove the key and read it back as null. This validates the clear path.

**3. "Workspace Context in Chat" test.describe:**
- Test "should load chat interface with workspace context": Navigate to /chat. Wait for the page to load (domcontentloaded). Verify the chat input placeholder "Type a message..." is visible. This confirms the chat route's workspace validation (which reads x-workspace-id header) does not block loading when the header is absent (personal workspace fallback).
- Test "should create thread with workspace context": Navigate to /chat. Type a message "E2E workspace thread test" and press Enter. Wait for URL to change to /chat/[threadId] pattern (timeout 15000). Verify the message appears on the page. This validates that /api/chat POST with workspace authorization succeeds end-to-end.

**4. "Workspace Settings with Authorization" test.describe:**
- Test "should load workspace settings with authorized access": Navigate to /settings/teams. Wait for loading to finish (Loading workspaces... hidden). Verify either "Workspace Settings" heading or empty state is visible. Navigate to a workspace if one exists and verify Members section loads (the members query now goes through workspace-authorized procedures).

**Implementation notes:**
- Use the same patterns as existing tests (Playwright test/expect imports, beforeEach navigation, proper timeouts)
- All new tests should be in the "chromium-authenticated" project (workspace.spec.ts is already matched by that pattern)
- Do NOT modify existing test blocks -- only append new describe blocks
- Use page.addInitScript for localStorage manipulation (runs before page load)
- Use page.evaluate for runtime localStorage checks
- The localStorage key is "sidekiq-active-workspace-id" (from use-active-workspace.ts ACTIVE_WORKSPACE_KEY constant)
  </action>
  <verify>
Run `cd /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp && npx playwright test workspace.spec.ts --reporter=list` to verify the workspace tests pass.
  </verify>
  <done>
New Phase 11 workspace authorization test sections added to workspace.spec.ts. All workspace tests pass.
  </done>
</task>

<task type="auto">
  <name>Task 2: Run full E2E suite and fix any failures</name>
  <files>sidekiq-webapp/tests/e2e/workspace.spec.ts</files>
  <action>
Run the full E2E test suite with `pnpm test:e2e` from the sidekiq-webapp directory (or the monorepo root if that's where the script is defined).

If any tests fail:

1. **Workspace auth-related failures** (most likely): Phase 11 changed how data is queried (workspaceId scope instead of userId). If existing tests fail because the personal workspace fallback isn't resolving correctly:
   - Check if the global-setup.ts seed script creates a personal workspace for the test user. If not, the test user may need localStorage manipulation via page.addInitScript to set the workspace context.
   - If thread/sidekiq listing fails, add `page.addInitScript(() => { localStorage.removeItem("sidekiq-active-workspace-id"); })` to beforeEach blocks to ensure clean workspace state.

2. **Timing-related failures**: Increase timeouts if workspace authorization adds latency to data loading.

3. **Selector changes**: If any UI text changed (unlikely in Phase 11 which was server-only), update selectors.

4. **New test failures only**: Fix the newly added tests if they fail. Do NOT break existing passing tests.

Fix all issues encountered until `pnpm test:e2e` passes completely, or document any tests that fail for reasons outside Phase 11 scope (e.g., flaky network-dependent tests that were already known flaky).
  </action>
  <verify>
Run `cd /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp && pnpm test:e2e` and verify all tests pass (or only known-flaky tests remain).
  </verify>
  <done>
Full E2E suite passes. All existing tests continue to pass after Phase 11 changes. New workspace authorization tests pass.
  </done>
</task>

</tasks>

<verification>
- `pnpm test:e2e` passes with 0 failures (excluding known flaky tests)
- workspace.spec.ts contains new Phase 11 authorization test sections
- All existing E2E test files are unmodified (only workspace.spec.ts updated)
- New tests validate: personal workspace fallback, localStorage persistence, workspace-scoped chat creation, workspace settings with authorized access
</verification>

<success_criteria>
- All E2E tests pass including new workspace authorization tests
- New tests cover workspace data isolation, header injection, chat workspace context, and settings authorization
- No regressions in existing test suites (chat, sidebar, thread, sidekiq, auth, model-selection)
</success_criteria>

<output>
After completion, create `.planning/quick/026-update-e2e-test-suite-for-phase-12/026-SUMMARY.md`
</output>
