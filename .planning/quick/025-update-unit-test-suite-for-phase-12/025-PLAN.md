---
phase: quick
plan: 025
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/unit/api/thread.test.ts
  - sidekiq-webapp/tests/unit/api/chat.test.ts
autonomous: true

must_haves:
  truths:
    - "All 667+ unit tests pass with pnpm test:run (0 failures)"
    - "Thread router tests account for workspaceProcedure middleware (resolveWorkspaceId)"
    - "Chat API tests account for workspace authorization (validateWorkspaceMembership, x-workspace-id header, workspace-scoped sidekiq/thread checks)"
    - "New test cases cover Phase 11 workspace authorization scenarios"
  artifacts:
    - path: "sidekiq-webapp/tests/unit/api/thread.test.ts"
      provides: "Thread router tests updated for workspaceProcedure"
    - path: "sidekiq-webapp/tests/unit/api/chat.test.ts"
      provides: "Chat API tests updated for workspace authorization"
  key_links:
    - from: "tests/unit/api/thread.test.ts"
      to: "@sidekiq/shared/lib/workspace-auth"
      via: "vi.mock or db mock for resolveWorkspaceId"
      pattern: "workspace-auth|workspaces.*findFirst|workspaceMembers"
    - from: "tests/unit/api/chat.test.ts"
      to: "@sidekiq/shared/lib/workspace-auth"
      via: "vi.mock for validateWorkspaceMembership"
      pattern: "validateWorkspaceMembership|workspace-auth"
---

<objective>
Fix and update the unit test suite to cover Phase 11's workspace authorization changes. Phase 11 migrated all thread and sidekiq tRPC routers from `protectedProcedure` to `workspaceProcedure` and added workspace authorization to the chat route handler. This broke 25 existing tests across 2 files because:

1. **thread.test.ts (10 failures):** The `workspaceProcedure` middleware calls `resolveWorkspaceId` which queries `db.query.workspaces.findFirst` and `db.query.workspaceMembers.findFirst` -- neither is mocked in the test's DB mock, causing `TypeError: Cannot read properties of undefined (reading 'findFirst')`.

2. **chat.test.ts (15 failures):** The chat route now:
   - Uses `validateWorkspaceMembership` to validate the `x-workspace-id` header (new import from `@sidekiq/shared/lib/workspace-auth`)
   - Checks `sidekiqRecord.workspaceId !== workspaceId` instead of `sidekiqRecord.ownerId !== userId` for sidekiq authorization
   - Checks `existingThread.workspaceId !== workspaceId` for existing thread workspace validation (before user ownership check)
   - Returns 403 for workspace mismatch on existing threads

Purpose: Restore all 667+ tests to passing and add coverage for the new workspace authorization code paths introduced in Phase 11.
Output: Updated test files with all tests passing.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/11-workspace-authorization/11-02-SUMMARY.md
@sidekiq-webapp/tests/unit/api/thread.test.ts
@sidekiq-webapp/tests/unit/api/chat.test.ts
@sidekiq-webapp/src/features/chats/api/router.ts
@sidekiq-webapp/src/shared/lib/workspace-auth.ts
@sidekiq-webapp/src/shared/trpc/trpc.ts
@sidekiq-webapp/src/app/api/chat/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix thread router tests for workspaceProcedure</name>
  <files>sidekiq-webapp/tests/unit/api/thread.test.ts</files>
  <action>
    The thread router now uses `workspaceProcedure` which calls `resolveWorkspaceId` at `src/shared/trpc/trpc.ts:156`. This function queries `db.query.workspaces.findFirst` and `db.query.workspaceMembers.findFirst`. The existing mock for `db` only includes `db.query.threads` -- it needs `db.query.workspaces` and `db.query.workspaceMembers` too.

    **Option A (preferred -- mock at module level):** Mock `@sidekiq/shared/lib/workspace-auth` to bypass the DB calls entirely. Add this vi.mock BEFORE the imports:

    ```ts
    vi.mock("@sidekiq/shared/lib/workspace-auth", () => ({
      validateWorkspaceMembership: vi.fn().mockResolvedValue({ role: "owner", workspaceType: "personal" }),
      resolveWorkspaceId: vi.fn().mockResolvedValue({ workspaceId: "workspace-123", role: "owner" }),
    }));
    ```

    This cleanly bypasses workspace resolution so the thread router logic itself is tested in isolation.

    **Additional mock context update:** The `createMockContext` helper currently returns `{ db, session, headers }`. The `workspaceProcedure` middleware injects `workspaceId` and `workspaceRole` into `ctx` via `resolveWorkspaceId`. Since we're mocking `resolveWorkspaceId` to return `{ workspaceId: "workspace-123", role: "owner" }`, the middleware will inject these automatically.

    However, the `headers` in `createMockContext` needs to be a real `Headers` instance (it already is -- `new Headers()`). Ensure no changes needed here.

    **DB mock update:** The router procedures now filter with `eq(threads.workspaceId, ctx.workspaceId)` in WHERE clauses. The mocked DB functions (`findFirst`, `findMany`, `delete`, `update`) are already vi.fn() mocks that return whatever is configured, so the SQL filtering is not actually executed in unit tests. No changes needed to DB mock return values.

    **Test assertion updates:** Some error messages changed in Phase 11:
    - Thread `delete`, `archive`, `unarchive`, `togglePin`, `rename` now throw `"Thread not found or access denied"` instead of the prior message. Verify existing assertions match (they check for `TRPCError` code, not message, so they should still pass).

    After adding the `workspace-auth` mock, run `pnpm test:run tests/unit/api/thread.test.ts` to verify all thread tests pass.
  </action>
  <verify>
    Run `cd /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp && pnpm test:run tests/unit/api/thread.test.ts` -- all tests pass (0 failures).
  </verify>
  <done>
    All thread router tests pass. The `resolveWorkspaceId` module is mocked to return a valid workspace context, allowing thread router procedures to execute normally under `workspaceProcedure`.
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix and extend chat API tests for workspace authorization</name>
  <files>sidekiq-webapp/tests/unit/api/chat.test.ts</files>
  <action>
    The chat route (`src/app/api/chat/route.ts`) now imports `validateWorkspaceMembership` from `@sidekiq/shared/lib/workspace-auth` and uses it for workspace authorization. Multiple existing tests fail because:

    1. **Workspace authorization now runs before thread/sidekiq checks:** The route reads `x-workspace-id` header and validates membership. Without the header, it falls back to personal workspace lookup.

    2. **Sidekiq authorization changed:** Now checks `sidekiqRecord.workspaceId !== workspaceId` instead of the old `sidekiqRecord.ownerId !== userId` pattern. The mock for `db.query.sidekiqs.findFirst` needs to return `{ workspaceId: "..." }` not `{ ownerId: "..." }`.

    3. **Existing thread authorization added:** Now checks `existingThread.workspaceId !== workspaceId` before the userId check.

    **Changes needed:**

    A. **Add workspace-auth mock** (before imports):
    ```ts
    vi.mock("@sidekiq/shared/lib/workspace-auth", () => ({
      validateWorkspaceMembership: vi.fn(),
    }));
    ```
    Then import it after mocks and set up default mock in beforeEach.

    B. **Update `createMockRequest` helper** to accept optional headers:
    ```ts
    function createMockRequest(body: unknown, headers?: Record<string, string>): Request {
      const reqHeaders = new Headers({ "Content-Type": "application/json" });
      if (headers) {
        Object.entries(headers).forEach(([k, v]) => reqHeaders.set(k, v));
      }
      return new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify(body),
      });
    }
    ```

    C. **Update `beforeEach` defaults:**
    - Add: `(validateWorkspaceMembership as Mock).mockResolvedValue({ role: "owner", workspaceType: "personal" });`
    - Keep the existing `db.query.workspaces.findFirst` mock as fallback for no-header path
    - Update sidekiq mock: Change `{ ownerId: "user-123", instructions: null }` to `{ workspaceId: "personal-workspace-123", instructions: null }` (the route now checks `sidekiqRecord.workspaceId !== workspaceId`)
    - Update thread mock: Add `workspaceId: "personal-workspace-123"` to the thread mock `{ id: "thread-123", userId: "user-123", workspaceId: "personal-workspace-123", messageCount: 0 }`
    - All requests that test "existing thread" or "with header" paths should include `x-workspace-id: "personal-workspace-123"` header via `createMockRequest(body, { "x-workspace-id": "personal-workspace-123" })`

    D. **Fix existing tests that now fail:**

    - **"should proceed when valid session exists"**: Add `x-workspace-id` header to request
    - **"should create new thread when threadId is missing"**: Keep as-is (falls back to personal workspace via db.query.workspaces.findFirst -- already mocked)
    - **"should create new thread when threadId is empty"**: Keep as-is (same fallback path)
    - **"should return 400 when last message is not from user"**: Add `x-workspace-id` header, add `workspaceId` to thread mock
    - **"should return 404 when thread not found"**: Add `x-workspace-id` header
    - **"should return 403 when thread belongs to different user"**: Add `x-workspace-id` header, update mock to include matching `workspaceId` so the workspace check passes and the userId check triggers the 403. If mock thread has `workspaceId: "personal-workspace-123"` and `userId: "other-user-456"`, the route first checks workspace (matches), then userId (mismatches -> 403).
    - **"should call streamText with correct model"**: Add `x-workspace-id` header, add `workspaceId` to thread mock
    - **"should save user message immediately"**: Add `x-workspace-id` header, add `workspaceId` to thread mock
    - **"should return streaming response"**: Add `x-workspace-id` header, add `workspaceId` to thread mock
    - **"should call consumeStream..."**: Add `x-workspace-id` header, add `workspaceId` to thread mock
    - **"should use default model when not specified"**: Add `x-workspace-id` header, add `workspaceId` to thread mock
    - **"should return 404 when sidekiqId not found"**: No header needed (falls back to personal workspace); sidekiq check happens after workspace resolution
    - **"should return 403 when sidekiq belongs to different user"**: This test name should change to "should return 403 when sidekiq belongs to different workspace". Update mock to return `{ workspaceId: "other-workspace-456", instructions: null }` instead of `{ ownerId: "other-user-456" }`. Without `x-workspace-id` header, route falls back to personal workspace "personal-workspace-123", then checks sidekiq.workspaceId ("other-workspace-456") !== workspaceId ("personal-workspace-123") -> 403.
    - **"should proceed when valid sidekiqId owned by user"**: Change to "should proceed when valid sidekiqId in same workspace". Update mock to return `{ workspaceId: "personal-workspace-123", instructions: "..." }`.
    - **"should call streamText with system message..."**: Update sidekiq mock to include `workspaceId: "personal-workspace-123"` alongside `instructions`
    - **"should call streamText without system message..."**: Update sidekiq mock to include `workspaceId: "personal-workspace-123"` alongside `instructions: null`
    - **"should use thread.sidekiqId for existing threads"**: Add `x-workspace-id` header, add `workspaceId` to thread mock, update sidekiq mock to include `workspaceId: "personal-workspace-123"`
    - **"should not look up personal workspace for existing threads"**: Add `x-workspace-id` header, add `workspaceId` to thread mock. When header is present AND validateWorkspaceMembership returns truthy, the route uses the header workspace directly and does NOT call `db.query.workspaces.findFirst`.
    - **"should return 500 when personal workspace not found for new thread"**: Keep as-is (no header, personal lookup returns null -> 500). BUT need to also mock `validateWorkspaceMembership` to NOT be called (no header path skips it). The route only calls validateWorkspaceMembership when headerWorkspaceId is truthy. So for no-header requests, it falls back to personal workspace lookup directly -- no change needed.
    - **"should assign workspaceId from personal workspace..."**: Keep as-is (no header, falls back to personal workspace)

    E. **Add new workspace authorization test cases** inside a new `describe("workspace authorization")` block:

    1. `"should return 403 when x-workspace-id header is invalid (not a member)"`:
       - Mock `validateWorkspaceMembership` to return `null`
       - Send request with header `x-workspace-id: "invalid-workspace"`
       - Assert response status 403
       - Assert response body `{ error: "Access denied" }`

    2. `"should use workspace from x-workspace-id header when membership is valid"`:
       - Mock `validateWorkspaceMembership` to return `{ role: "member", workspaceType: "team" }`
       - Send request with header `x-workspace-id: "team-workspace-456"`, no threadId (new thread)
       - Mock `db.query.sidekiqs.findFirst` to return null (no sidekiq)
       - Assert response status 200
       - Assert `db.insert` was called (new thread created in the team workspace)

    3. `"should return 403 when existing thread workspace does not match active workspace"`:
       - Mock `validateWorkspaceMembership` to return `{ role: "owner", workspaceType: "personal" }`
       - Mock `db.query.threads.findFirst` to return `{ id: "thread-123", userId: "user-123", workspaceId: "other-workspace-789", messageCount: 0 }`
       - Send request with header `x-workspace-id: "personal-workspace-123"` and threadId: "thread-123"
       - Assert response status 403
       - Assert response body `{ error: "Access denied" }`

    4. `"should return 403 when sidekiq workspace does not match active workspace"`:
       - Mock `validateWorkspaceMembership` to return `{ role: "owner", workspaceType: "personal" }`
       - Mock `db.query.sidekiqs.findFirst` to return `{ workspaceId: "different-workspace-999" }`
       - Send request with header `x-workspace-id: "personal-workspace-123"`, no threadId, sidekiqId: "sidekiq-123"
       - Assert response status 403
       - Assert response body `{ error: "Access denied" }`

    After all changes, run `pnpm test:run tests/unit/api/chat.test.ts` to verify all tests pass.
  </action>
  <verify>
    Run `cd /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp && pnpm test:run tests/unit/api/chat.test.ts` -- all tests pass (0 failures).
    Then run full suite: `pnpm test:run` -- all tests pass (expect ~671 total: 667 prior + 4 new workspace authorization tests).
  </verify>
  <done>
    All chat API tests pass. Existing tests updated to account for workspace authorization flow (x-workspace-id header, validateWorkspaceMembership mock, workspaceId on thread/sidekiq mocks). 4 new test cases cover workspace authorization: invalid membership returns 403, valid header uses team workspace, thread workspace mismatch returns 403, sidekiq workspace mismatch returns 403. Total test count ~671 with 0 failures.
  </done>
</task>

</tasks>

<verification>
1. `cd /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp && pnpm test:run` -- all tests pass, 0 failures, total ~671
2. `pnpm test:run tests/unit/api/thread.test.ts` -- all thread router tests pass
3. `pnpm test:run tests/unit/api/chat.test.ts` -- all chat API tests pass including new workspace authorization tests
4. No regressions in other test files (the 32 previously-passing test files still pass)
</verification>

<success_criteria>
- All 25 currently-failing tests are fixed (0 failures in full suite)
- Thread router tests mock resolveWorkspaceId so workspaceProcedure works in test context
- Chat API tests mock validateWorkspaceMembership and use x-workspace-id header where needed
- Sidekiq authorization tests use workspaceId (not ownerId) matching the Phase 11 route changes
- Existing thread tests include workspaceId in thread mock and pass workspace validation
- 4 new workspace authorization test cases added to chat API tests
- Full test suite passes with `pnpm test:run`
</success_criteria>

<output>
After completion, create `.planning/quick/025-update-unit-test-suite-for-phase-12/025-SUMMARY.md`
</output>
