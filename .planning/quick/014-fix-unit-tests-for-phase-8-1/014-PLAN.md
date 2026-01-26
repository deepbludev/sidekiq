---
phase: quick-014
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/unit/components/thread/thread-item.test.tsx
  - sidekiq-webapp/tests/unit/components/chat/chat-input.test.tsx
  - sidekiq-webapp/tests/unit/components/chat/empty-state.test.tsx
  - sidekiq-webapp/tests/unit/components/chat/message-content.test.tsx
  - sidekiq-webapp/tests/unit/components/chat/message-list.test.tsx
  - sidekiq-webapp/tests/unit/components/chat/scroll-to-bottom.test.tsx
  - sidekiq-webapp/tests/unit/components/model-picker/model-picker-trigger.test.tsx
  - sidekiq-webapp/tests/unit/components/sidekiq/delete-sidekiq-dialog.test.tsx
  - sidekiq-webapp/tests/unit/components/sidekiq/sidekiq-indicator.test.tsx
  - sidekiq-webapp/tests/unit/components/theme/theme-toggle.test.tsx
  - sidekiq-webapp/tests/unit/components/thread/delete-thread-dialog.test.tsx
  - sidekiq-webapp/tests/unit/components/thread/rename-thread-input.test.tsx
  - sidekiq-webapp/tests/unit/components/thread/thread-context-menu.test.tsx
autonomous: true

must_haves:
  truths:
    - "pnpm test:run passes with zero failures"
    - "All existing test files compile and run without errors"
    - "Tests correctly reference current component APIs after Phase 8.1 changes"
  artifacts:
    - path: "sidekiq-webapp/tests/unit/"
      provides: "Updated test suite"
  key_links:
    - from: "sidekiq-webapp/tests/unit/components/thread/thread-item.test.tsx"
      to: "src/components/thread/thread-item.tsx"
      via: "direct import"
      pattern: "import.*thread-item"
---

<objective>
Fix all unit test failures caused by Phase 8.1 (Rethink Branding & UI) changes, and add tests for new Phase 8.1 features where appropriate.

Purpose: Phase 8.1 migrated ~80+ components to semantic tokens, changed class names (e.g., `bg-accent` to `bg-sidebar-accent` for active thread items), restructured the ChatInput to an editor-like card layout, and updated various component APIs. Existing tests may reference old class names, old DOM structures, or stale component props that no longer exist.

Output: All existing unit tests updated to pass with current component implementations. New test cases added where Phase 8.1 introduced testable behavioral changes.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@sidekiq-webapp/vitest.config.ts

# Key Phase 8.1 changes to be aware of:
# - ThreadItem: bg-accent -> bg-sidebar-accent, added border-l-2 border-sidebar-primary for active state
# - ChatInput: Restructured to editor-like card layout (bordered card container with toolbar area)
# - EmptyState: Styling changes from bg-card/border-border semantic tokens
# - All components: zinc-*/glass/backdrop-blur replaced with semantic tokens
# - Font: Inter replacing Geist
# - Border radius: 6px base (rounded-md default)

# Source files (read to understand current component APIs):
@sidekiq-webapp/src/components/thread/thread-item.tsx
@sidekiq-webapp/src/components/chat/chat-input.tsx
@sidekiq-webapp/src/components/chat/empty-state.tsx

# Existing test files to fix:
@sidekiq-webapp/tests/unit/components/thread/thread-item.test.tsx
@sidekiq-webapp/tests/unit/components/chat/chat-input.test.tsx
@sidekiq-webapp/tests/unit/components/chat/empty-state.test.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Run test suite, identify all failures, and fix them</name>
  <files>
    sidekiq-webapp/tests/unit/components/thread/thread-item.test.tsx
    sidekiq-webapp/tests/unit/components/chat/chat-input.test.tsx
    sidekiq-webapp/tests/unit/components/chat/empty-state.test.tsx
    sidekiq-webapp/tests/unit/components/chat/message-content.test.tsx
    sidekiq-webapp/tests/unit/components/chat/message-list.test.tsx
    sidekiq-webapp/tests/unit/components/chat/scroll-to-bottom.test.tsx
    sidekiq-webapp/tests/unit/components/model-picker/model-picker-trigger.test.tsx
    sidekiq-webapp/tests/unit/components/sidekiq/delete-sidekiq-dialog.test.tsx
    sidekiq-webapp/tests/unit/components/sidekiq/sidekiq-indicator.test.tsx
    sidekiq-webapp/tests/unit/components/theme/theme-toggle.test.tsx
    sidekiq-webapp/tests/unit/components/thread/delete-thread-dialog.test.tsx
    sidekiq-webapp/tests/unit/components/thread/rename-thread-input.test.tsx
    sidekiq-webapp/tests/unit/components/thread/thread-context-menu.test.tsx
  </files>
  <action>
1. Run `cd sidekiq-webapp && pnpm test:run` to identify ALL failing tests.
2. For each failing test, read the corresponding source component to understand what changed in Phase 8.1.
3. Fix each test failure. Common Phase 8.1 breakages to look for:

**ThreadItem (thread-item.test.tsx):**
- Active state class changed from `bg-accent` to `bg-sidebar-accent` (line ~127 of test)
- Active state now also includes `border-sidebar-primary border-l-2` (left accent bar)
- Pin icon class may have changed

**ChatInput (chat-input.test.tsx):**
- ChatInput was restructured to editor-like card layout (bordered card container)
- DOM structure changed: textarea is now inside a `div.border-border.bg-card.rounded-md.border` card
- Toolbar area added above textarea with border-b separator
- Button layout changed: buttons are now inside the card at the bottom

**EmptyState (empty-state.test.tsx):**
- Prompt buttons changed styling: `border-border bg-card` instead of previous classes
- DOM structure may be the same but class names changed

**Other component tests:**
- Any test checking for hardcoded zinc-*, glass-*, backdrop-blur-* classes will fail
- Tests checking for `rounded-full` may need updating where `rounded-lg` is now used
- Tests checking specific color classes need semantic token equivalents

4. Do NOT change the source components -- only fix the test files.
5. After fixing all failures, run `pnpm test:run` again to confirm all tests pass.
  </action>
  <verify>Run `cd sidekiq-webapp && pnpm test:run` - all tests pass with zero failures</verify>
  <done>All existing unit tests pass against the Phase 8.1 codebase with updated class name references and DOM structure expectations</done>
</task>

<task type="auto">
  <name>Task 2: Add tests for Phase 8.1 behavioral changes</name>
  <files>
    sidekiq-webapp/tests/unit/components/chat/chat-input.test.tsx
    sidekiq-webapp/tests/unit/components/thread/thread-item.test.tsx
  </files>
  <action>
Add targeted tests for new Phase 8.1 behaviors. Only add tests for genuinely new testable behavior -- do not pad with trivial assertions.

**ChatInput editor-like layout tests (add to chat-input.test.tsx):**
- Test that the card container has the correct structure: `border-border bg-card rounded-md border` classes on the wrapping div
- Test that when `sidekiq` prop is provided, the toolbar area renders with "Chatting with [name]" text
- Test that when `modelPicker` prop is provided, the toolbar area renders (verify toolbar div with border-b appears)
- Test that when neither `sidekiq` nor `modelPicker` is provided, no toolbar area renders

**ThreadItem active state tests (add to thread-item.test.tsx):**
- Update existing active styling test to check for `bg-sidebar-accent` instead of `bg-accent`
- Add test: active thread has left accent bar (check for `border-l-2` class on active container)
- Add test: Sidekiq avatar renders when thread has sidekiq relation
- Add test: Deleted sidekiq shows "?" placeholder and "[Sidekiq deleted]" subtitle

Follow the existing test helper patterns in each file. Use the same `renderChatInput` and `renderThreadItem` helpers.
  </action>
  <verify>Run `cd sidekiq-webapp && pnpm test:run` - all tests pass including new Phase 8.1 tests</verify>
  <done>New Phase 8.1 behavioral tests added: ChatInput toolbar/editor layout (4 tests), ThreadItem active state and sidekiq indicators (4 tests). Full suite passes.</done>
</task>

</tasks>

<verification>
Run the full unit test suite to confirm everything passes:
```bash
cd sidekiq-webapp && pnpm test:run
```
All existing tests plus new Phase 8.1 tests pass with zero failures.
</verification>

<success_criteria>
- `pnpm test:run` passes with zero test failures
- All existing tests updated to match Phase 8.1 component APIs
- ~8 new test cases added for Phase 8.1 behavioral changes
- No source component files modified (tests only)
</success_criteria>

<output>
After completion, create `.planning/quick/014-fix-unit-tests-for-phase-8-1/014-SUMMARY.md`
</output>
