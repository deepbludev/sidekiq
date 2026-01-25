---
phase: quick-010
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/e2e/sidekiq.spec.ts
autonomous: true

must_haves:
  truths:
    - "E2E tests verify starting chat with Sidekiq via /chat?sidekiq={id}"
    - "E2E tests verify Sidekiq picker opens with Cmd+Shift+S"
    - "E2E tests verify Sidekiq indicator displays in chat header"
    - "E2E tests verify 'Chatting with' badge appears in input area"
    - "E2E tests verify sidebar shows Sidekiq avatar on threads"
    - "E2E tests verify sidebar shows 'with [name]' subtitle"
    - "E2E tests verify thread resume restores Sidekiq context"
  artifacts:
    - path: "sidekiq-webapp/tests/e2e/sidekiq.spec.ts"
      provides: "Phase 7 Sidekiq chat integration E2E tests"
      contains: "Sidekiq Chat Integration"
---

<objective>
Add E2E tests for Phase 7 Sidekiq Chat Integration features.

Purpose: Verify the complete Sidekiq chat flow works end-to-end, including URL navigation, UI indicators, keyboard shortcuts, and context preservation.

Output: Extended sidekiq.spec.ts with comprehensive Phase 7 tests.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@sidekiq-webapp/tests/e2e/sidekiq.spec.ts
@sidekiq-webapp/src/components/chat/chat-header.tsx
@sidekiq-webapp/src/components/chat/chat-input.tsx
@sidekiq-webapp/src/components/sidekiq/sidekiq-picker.tsx
@sidekiq-webapp/src/components/thread/thread-item.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Sidekiq Chat Integration E2E Tests</name>
  <files>sidekiq-webapp/tests/e2e/sidekiq.spec.ts</files>
  <action>
Add a new test.describe block "Sidekiq Chat Integration" to sidekiq.spec.ts with the following tests:

**Test 1: should start chat with Sidekiq via URL**
1. Create a test Sidekiq using existing `createTestSidekiq` helper
2. Navigate to `/chat?sidekiq={id}`
3. Verify URL contains the sidekiq query param
4. Verify chat header shows Sidekiq name (look for SidekiqIndicator)
5. Verify "Chatting with {name}" badge appears above input
6. Clean up the test Sidekiq

**Test 2: should open Sidekiq picker with Cmd+Shift+S**
1. Navigate to `/chat`
2. Press Cmd+Shift+S (Meta+Shift+S on Mac, Control+Shift+S elsewhere)
3. Verify dialog opens with "Search Sidekiqs..." placeholder
4. Verify "Create new Sidekiq" option is visible
5. Press Escape to close

**Test 3: should select Sidekiq from picker and navigate**
1. Create a test Sidekiq
2. Navigate to `/chat`
3. Open Sidekiq picker with keyboard shortcut
4. Type part of the Sidekiq name to search
5. Click on the Sidekiq in results
6. Verify navigation to `/chat?sidekiq={id}`
7. Clean up

**Test 4: should show Sidekiq indicator in chat header**
1. Create a test Sidekiq
2. Navigate to `/chat?sidekiq={id}`
3. Verify Sidekiq name appears in chat header
4. Click the indicator to open popover
5. Verify popover shows Sidekiq description
6. Verify "Edit Sidekiq" link exists in popover
7. Clean up

**Test 5: should display conversation starters for Sidekiq**
1. Create a test Sidekiq with conversation starters (use template that has them)
2. Navigate to `/chat?sidekiq={id}`
3. Verify conversation starters appear in empty state (if configurable - may need to select a template with starters)
4. Skip if no starters visible (template-dependent)
5. Clean up

**Test 6: should show Sidekiq in sidebar thread after sending message**
1. Create a test Sidekiq
2. Navigate to `/chat?sidekiq={id}`
3. Send a test message
4. Wait for thread creation (URL changes to /chat/{threadId})
5. Verify sidebar thread item shows Sidekiq avatar (check for SidekiqAvatar class or data attribute)
6. Verify sidebar shows "with {name}" subtitle below thread title
7. Clean up

**Test 7: should preserve Sidekiq context when resuming thread**
1. Create a test Sidekiq
2. Navigate to `/chat?sidekiq={id}` and send a message
3. Wait for thread creation
4. Navigate away to `/chat` (new chat)
5. Find and click the thread in sidebar
6. Verify chat header still shows Sidekiq name
7. Verify "Chatting with" badge still appears
8. Clean up

Use existing patterns from sidekiq.spec.ts:
- Reuse `createTestSidekiq` and `deleteSidekiqByName` helpers
- Handle rate limiting with try/catch and test.skip
- Use `force: true` for click operations to avoid dev overlay issues
- Add appropriate waitForTimeout/waitForLoadState between operations

Note: Tests should be in the same `test.describe.configure({ mode: "serial" })` block to avoid rate limiting.
  </action>
  <verify>
Run `cd sidekiq-webapp && pnpm test:e2e --grep "Sidekiq Chat Integration"` - all new tests pass.
  </verify>
  <done>
E2E tests for Phase 7 Sidekiq chat integration are added and passing, covering:
- URL-based Sidekiq chat start
- Keyboard shortcut for picker
- Chat header indicator with popover
- Input area badge
- Sidebar visual indicators
- Thread resume with context preservation
  </done>
</task>

</tasks>

<verification>
```bash
# Run all Sidekiq E2E tests
cd sidekiq-webapp && pnpm test:e2e --grep "Sidekiq"

# Verify new test block exists
grep -c "Sidekiq Chat Integration" tests/e2e/sidekiq.spec.ts
```
</verification>

<success_criteria>
- [ ] New "Sidekiq Chat Integration" test.describe block added to sidekiq.spec.ts
- [ ] At least 6 tests covering Phase 7 features
- [ ] Tests use existing helpers (createTestSidekiq, deleteSidekiqByName)
- [ ] Tests handle rate limiting gracefully
- [ ] All tests pass when run with `pnpm test:e2e --grep "Sidekiq Chat Integration"`
</success_criteria>

<output>
After completion, create `.planning/quick/010-update-e2e-tests-for-phase-7/010-SUMMARY.md`
</output>
