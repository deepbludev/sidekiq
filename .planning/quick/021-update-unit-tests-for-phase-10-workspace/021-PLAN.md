---
phase: quick
plan: 021
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/unit/components/workspace/workspace-avatar.test.tsx
  - sidekiq-webapp/tests/unit/lib/workspace-permissions.test.ts
  - sidekiq-webapp/tests/unit/validations/workspace.test.ts
  - sidekiq-webapp/tests/unit/api/chat.test.ts
autonomous: true

must_haves:
  truths:
    - "All workspace test files use workspace naming (no team-named test files remain)"
    - "Chat API tests cover the personal workspace lookup path added in Phase 10"
    - "All tests pass with pnpm test:run (0 failures)"
  artifacts:
    - path: "sidekiq-webapp/tests/unit/components/workspace/workspace-avatar.test.tsx"
      provides: "WorkspaceAvatar component tests (moved from team/ directory)"
    - path: "sidekiq-webapp/tests/unit/lib/workspace-permissions.test.ts"
      provides: "Workspace permission utility tests (renamed from team-permissions)"
    - path: "sidekiq-webapp/tests/unit/validations/workspace.test.ts"
      provides: "Workspace validation schema tests (renamed from team.test.ts)"
    - path: "sidekiq-webapp/tests/unit/api/chat.test.ts"
      provides: "Chat API tests including personal workspace lookup coverage"
  key_links:
    - from: "tests/unit/components/workspace/workspace-avatar.test.tsx"
      to: "@sidekiq/workspace/components/workspace-avatar"
      via: "import"
      pattern: "import.*WorkspaceAvatar.*workspace-avatar"
    - from: "tests/unit/lib/workspace-permissions.test.ts"
      to: "@sidekiq/workspace/lib/permissions"
      via: "import"
      pattern: "import.*from.*@sidekiq/workspace/lib/permissions"
    - from: "tests/unit/validations/workspace.test.ts"
      to: "@sidekiq/workspace/validations"
      via: "import"
      pattern: "import.*from.*@sidekiq/workspace/validations"
---

<objective>
Update the unit test suite to reflect Phase 10's workspace schema migration. Test files still live under old "team" directory/file names despite their internal code already using workspace imports. Rename files to match conventions, add missing test coverage for the personal workspace lookup in the chat API route, and verify all tests pass.

Purpose: Align test file organization with the workspace naming established in Phase 10, and close test coverage gaps for new workspace-specific behavior (personal workspace lookup on thread creation).
Output: Renamed test files under workspace directories, new chat API test cases, all 664+ tests passing.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/10-workspace-schema-migration/10-VERIFICATION.md
@.planning/phases/10-workspace-schema-migration/10-05-SUMMARY.md
@sidekiq-webapp/tests/unit/api/chat.test.ts
@sidekiq-webapp/tests/unit/components/team/team-avatar.test.tsx
@sidekiq-webapp/tests/unit/lib/team-permissions.test.ts
@sidekiq-webapp/tests/unit/validations/team.test.ts
@sidekiq-webapp/src/app/api/chat/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rename team-named test files to workspace naming</name>
  <files>
    sidekiq-webapp/tests/unit/components/workspace/workspace-avatar.test.tsx
    sidekiq-webapp/tests/unit/lib/workspace-permissions.test.ts
    sidekiq-webapp/tests/unit/validations/workspace.test.ts
  </files>
  <action>
    Move/rename three test files from team naming to workspace naming. The test file CONTENTS already use workspace imports and workspace function names (updated in Phase 10 Plan 05), so only the file paths need to change:

    1. `tests/unit/components/team/team-avatar.test.tsx` -> `tests/unit/components/workspace/workspace-avatar.test.tsx`
       - Create `tests/unit/components/workspace/` directory
       - Move the file (content is already correct - uses WorkspaceAvatar import from @sidekiq/workspace)
       - Delete the old `tests/unit/components/team/` directory if empty after move

    2. `tests/unit/lib/team-permissions.test.ts` -> `tests/unit/lib/workspace-permissions.test.ts`
       - Rename in place (content is already correct - imports from @sidekiq/workspace/lib/permissions)
       - Delete old file

    3. `tests/unit/validations/team.test.ts` -> `tests/unit/validations/workspace.test.ts`
       - Rename in place (content is already correct - imports from @sidekiq/workspace/validations)
       - Delete old file

    Do NOT modify file contents - they are already correct. This is purely a file rename operation.
  </action>
  <verify>
    Run `pnpm test:run` from sidekiq-webapp/ - all tests should pass (same count as before, ~664).
    Verify old files no longer exist: `ls tests/unit/components/team/ tests/unit/lib/team-permissions.test.ts tests/unit/validations/team.test.ts` should all fail with "No such file or directory".
    Verify new files exist: `ls tests/unit/components/workspace/workspace-avatar.test.tsx tests/unit/lib/workspace-permissions.test.ts tests/unit/validations/workspace.test.ts` should succeed.
  </verify>
  <done>
    All three test files renamed to workspace naming. No team-named test files remain in the test suite. All existing tests continue to pass at the same count.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add chat API tests for personal workspace lookup</name>
  <files>sidekiq-webapp/tests/unit/api/chat.test.ts</files>
  <action>
    Add new test cases to `tests/unit/api/chat.test.ts` to cover the personal workspace lookup added in Phase 10. The chat route now queries `db.query.workspaces.findFirst` for the user's personal workspace when creating a new thread, and returns 500 if not found. The mock for `workspaces.findFirst` already exists in the test file's `beforeEach`.

    Add these test cases inside the existing `describe("POST /api/chat")` block:

    1. **New describe block: "personal workspace lookup"** with these tests:

       a. `"should return 500 when personal workspace not found for new thread"`:
          - Mock `db.query.workspaces.findFirst` to return `null`
          - Send request WITHOUT threadId (triggers new thread creation path)
          - Assert response status is 500
          - Assert response body has `{ error: "Personal workspace not found" }`

       b. `"should assign workspaceId from personal workspace when creating new thread"`:
          - Mock `db.query.workspaces.findFirst` to return `{ id: "personal-ws-789" }`
          - Send request WITHOUT threadId (triggers new thread creation path)
          - Assert response status is 200
          - Assert `db.insert` was called (thread creation happened)
          - Verify the insert values chain was invoked (confirming thread was created with workspace context)

       c. `"should not look up personal workspace for existing threads"`:
          - Clear `db.query.workspaces.findFirst` mock call count
          - Send request WITH valid threadId (existing thread path)
          - Assert response status is 200
          - Assert `db.query.workspaces.findFirst` was NOT called (workspace lookup only happens for new threads)

    Use the existing test helpers (`createMockRequest`, `validChatBody`) and mock patterns already in the file. Follow the existing code style with `as Mock` casts and JSDoc-style interface types.
  </action>
  <verify>
    Run `pnpm test:run` from sidekiq-webapp/ - all tests should pass with count increased by 3 (from ~664 to ~667).
    Specifically verify: `pnpm test:run tests/unit/api/chat.test.ts` should show all tests passing including the new "personal workspace lookup" describe block.
  </verify>
  <done>
    Chat API tests cover the personal workspace lookup path: 500 when workspace not found, workspace ID passed to thread creation, and no lookup for existing threads. Total test count increased by 3.
  </done>
</task>

</tasks>

<verification>
1. `cd sidekiq-webapp && pnpm test:run` -- all tests pass, total count ~667 (664 + 3 new)
2. No test files remain with "team" naming: `find tests/unit -name "*team*" -type f` returns empty
3. New workspace-named test files exist and pass individually:
   - `pnpm test:run tests/unit/components/workspace/workspace-avatar.test.tsx`
   - `pnpm test:run tests/unit/lib/workspace-permissions.test.ts`
   - `pnpm test:run tests/unit/validations/workspace.test.ts`
   - `pnpm test:run tests/unit/api/chat.test.ts`
4. TypeScript compiles cleanly: `npx tsc --noEmit`
</verification>

<success_criteria>
- Zero team-named test files in the test suite (all renamed to workspace)
- Chat API test file includes personal workspace lookup test coverage (3 new tests)
- All tests pass with `pnpm test:run` (0 failures, ~667 total)
- No regressions introduced
</success_criteria>

<output>
After completion, create `.planning/quick/021-update-unit-tests-for-phase-10-workspace/021-SUMMARY.md`
</output>
