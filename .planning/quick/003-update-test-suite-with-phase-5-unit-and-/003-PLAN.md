---
phase: quick
plan: 003
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/unit/lib/date-grouping.test.ts
  - sidekiq-webapp/tests/unit/hooks/use-sidebar-state.test.ts
  - sidekiq-webapp/tests/e2e/sidebar.spec.ts
autonomous: true
must_haves:
  truths:
    - "date-grouping.ts has comprehensive unit test coverage"
    - "use-sidebar-state hook has unit tests with localStorage mocking"
    - "Sidebar navigation flow has E2E coverage"
  artifacts:
    - path: "sidekiq-webapp/tests/unit/lib/date-grouping.test.ts"
      provides: "Unit tests for groupThreadsByDate and formatThreadTimestamp"
    - path: "sidekiq-webapp/tests/unit/hooks/use-sidebar-state.test.ts"
      provides: "Unit tests for useSidebarState hook"
    - path: "sidekiq-webapp/tests/e2e/sidebar.spec.ts"
      provides: "E2E tests for sidebar navigation"
  key_links:
    - from: "date-grouping.test.ts"
      to: "src/lib/date-grouping.ts"
      via: "import groupThreadsByDate, formatThreadTimestamp"
---

<objective>
Add unit and E2E tests for Phase 5 (Sidebar & Navigation) components and utilities.

Purpose: Ensure test coverage for the sidebar functionality including date grouping logic, sidebar state persistence, and navigation flow.
Output: 3 test files covering the most critical testable units from Phase 5.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@sidekiq-webapp/src/lib/date-grouping.ts
@sidekiq-webapp/src/hooks/use-sidebar-state.ts
@sidekiq-webapp/tests/unit/lib/ai/models.test.ts
@sidekiq-webapp/tests/unit/hooks/use-model-selection.test.ts
@sidekiq-webapp/tests/e2e/chat.spec.ts
@sidekiq-webapp/playwright.config.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Unit tests for date-grouping.ts</name>
  <files>sidekiq-webapp/tests/unit/lib/date-grouping.test.ts</files>
  <action>
Create comprehensive unit tests for date-grouping.ts functions:

**groupThreadsByDate tests:**
- Empty array returns empty array
- Archived threads are excluded from all groups
- Pinned threads appear ONLY in Pinned group (not duplicated in date groups)
- Today threads (isToday) go to "Today" group
- Yesterday threads (isYesterday) go to "Yesterday" group
- This week threads (isThisWeek but not today/yesterday) go to "This Week" group
- This month threads (isThisMonth but not this week) go to "This Month" group
- Older threads go to "Older" group
- Within each group, threads sorted by lastActivityAt descending
- Empty groups are filtered out (not returned)
- Group order is: Pinned, Today, Yesterday, This Week, This Month, Older

**formatThreadTimestamp tests:**
- Today returns relative time (e.g., "2 hours ago")
- Yesterday returns "Yesterday"
- Older dates return "MMM d" format (e.g., "Jan 15")

Use vi.useFakeTimers() to control "now" for predictable date comparisons.
Follow patterns from tests/unit/lib/ai/models.test.ts for structure.
  </action>
  <verify>Run `pnpm --filter sidekiq-webapp test tests/unit/lib/date-grouping.test.ts` - all tests pass</verify>
  <done>groupThreadsByDate and formatThreadTimestamp have 100% branch coverage with 15+ test cases</done>
</task>

<task type="auto">
  <name>Task 2: Unit tests for use-sidebar-state.ts</name>
  <files>sidekiq-webapp/tests/unit/hooks/use-sidebar-state.test.ts</files>
  <action>
Create unit tests for useSidebarState hook:

**Initial state tests:**
- Returns isCollapsed: false when localStorage is empty (SSR default)
- Returns isCollapsed: true when localStorage has "true"
- Returns isCollapsed: false when localStorage has "false"

**toggle() tests:**
- Toggles from false to true
- Toggles from true to false
- Updates localStorage on toggle

**setIsCollapsed() tests:**
- Sets collapsed to true
- Sets collapsed to false
- Updates localStorage with string value

Mock localStorage with vi.stubGlobal or Object.defineProperty.
Use renderHook from @testing-library/react.
Follow patterns from tests/unit/hooks/use-model-selection.test.ts for hook testing.
  </action>
  <verify>Run `pnpm --filter sidekiq-webapp test tests/unit/hooks/use-sidebar-state.test.ts` - all tests pass</verify>
  <done>useSidebarState hook has full coverage for initial state, toggle, and setIsCollapsed</done>
</task>

<task type="auto">
  <name>Task 3: E2E tests for sidebar navigation</name>
  <files>sidekiq-webapp/tests/e2e/sidebar.spec.ts</files>
  <action>
Create E2E tests for sidebar navigation flow:

**Sidebar visibility tests:**
- Sidebar is visible on desktop (expanded by default)
- Sidebar collapse button is visible
- Clicking collapse button hides thread list (shows icon rail)
- Clicking expand button shows thread list

**Thread list tests:**
- Thread list displays existing threads (requires auth)
- Clicking a thread navigates to /chat/[threadId]
- Search input is visible and focusable

**Mobile sidebar tests:**
- On mobile viewport, sidebar is hidden by default
- Mobile menu button opens sidebar drawer
- Clicking thread in drawer closes drawer and navigates

Add sidebar.spec.ts to playwright.config.ts testMatch for authenticated project:
`testMatch: /(chat|thread|model-selection|sidebar)\.spec\.ts/`

Use page.setViewportSize for mobile tests.
Follow patterns from tests/e2e/chat.spec.ts for structure.
  </action>
  <verify>Run `pnpm --filter sidekiq-webapp test:e2e tests/e2e/sidebar.spec.ts` - all tests pass</verify>
  <done>Sidebar E2E tests cover collapse/expand, thread selection, and mobile drawer</done>
</task>

</tasks>

<verification>
```bash
# Run all new Phase 5 tests
pnpm --filter sidekiq-webapp test tests/unit/lib/date-grouping.test.ts tests/unit/hooks/use-sidebar-state.test.ts

# Run E2E sidebar tests (requires dev server)
pnpm --filter sidekiq-webapp test:e2e tests/e2e/sidebar.spec.ts

# Verify all existing tests still pass
pnpm --filter sidekiq-webapp test
```
</verification>

<success_criteria>
- date-grouping.test.ts: 15+ test cases covering all date groups, sorting, and edge cases
- use-sidebar-state.test.ts: 8+ test cases covering localStorage persistence and state management
- sidebar.spec.ts: 8+ E2E tests covering desktop sidebar, mobile drawer, and navigation
- All existing tests continue to pass
- No type errors in test files
</success_criteria>

<output>
After completion, create `.planning/quick/003-update-test-suite-with-phase-5-unit-and-/003-SUMMARY.md`
</output>
