---
phase: quick
plan: 003
subsystem: testing
tags: [unit-tests, e2e-tests, sidebar, vitest, playwright]
dependency-graph:
  requires: [Phase 5 sidebar implementation]
  provides: [Test coverage for date-grouping, use-sidebar-state, sidebar E2E]
  affects: [CI/CD pipeline, regression testing]
tech-stack:
  added: []
  patterns: [vi.useFakeTimers for date testing, localStorage mocking for hooks, Playwright mobile viewport testing]
key-files:
  created:
    - sidekiq-webapp/tests/unit/lib/date-grouping.test.ts
    - sidekiq-webapp/tests/unit/hooks/use-sidebar-state.test.ts
    - sidekiq-webapp/tests/e2e/sidebar.spec.ts
  modified:
    - sidekiq-webapp/playwright.config.ts
decisions:
  - decision: Use vi.useFakeTimers for predictable date comparisons in date-grouping tests
    rationale: Ensures tests are deterministic regardless of when they run
  - decision: Use localStorage mock with vi.fn() for hook testing
    rationale: Enables assertion on localStorage calls and control of initial state
  - decision: Add sidebar.spec.ts to authenticated test project
    rationale: Sidebar requires authentication to display threads
metrics:
  duration: 4 minutes
  completed: 2026-01-24
---

# Quick Task 003: Update test suite with Phase 5 unit and E2E tests

**One-liner:** Comprehensive test coverage for sidebar date grouping, state persistence, and E2E navigation flows

## Changes Made

### 1. Unit tests for date-grouping.ts (24 tests)
Created `/sidekiq-webapp/tests/unit/lib/date-grouping.test.ts` with:

**groupThreadsByDate tests:**
- Edge cases: empty array, all archived threads
- Archived threads: exclusion from all groups
- Pinned threads: only in Pinned group (no duplication)
- Date categorization: Today, Yesterday, This Week, This Month, Older
- Sorting: within groups by lastActivityAt descending
- Empty groups: filtered from output
- Group order: Pinned, Today, Yesterday, This Week, This Month, Older
- Complex scenarios: mixed thread types

**formatThreadTimestamp tests:**
- Today: relative time (hours ago, minutes ago)
- Yesterday: "Yesterday" regardless of time
- Older: "MMM d" format

### 2. Unit tests for use-sidebar-state.ts (14 tests)
Created `/sidekiq-webapp/tests/unit/hooks/use-sidebar-state.test.ts` with:

**Initial state tests:**
- Empty localStorage returns false
- localStorage "true" returns true
- localStorage "false" returns false
- Correct storage key used

**toggle() tests:**
- Toggle false to true
- Toggle true to false
- Updates localStorage on toggle
- Multiple toggles work correctly

**setIsCollapsed() tests:**
- Set to true
- Set to false
- localStorage updated with string value
- Idempotent when setting same value

### 3. E2E tests for sidebar navigation (16 tests)
Created `/sidekiq-webapp/tests/e2e/sidebar.spec.ts` with:

**Sidebar Visibility:**
- Sidebar visible on desktop
- Collapse button visible
- Thread list hidden when collapsed (icon rail)
- Thread list shown when expanded

**Thread List:**
- Thread list area displayed
- Navigate to thread on click
- Search input visible
- Cmd+K/Ctrl+K focuses search

**Mobile Sidebar:**
- Hidden by default on mobile viewport
- Mobile menu button visible
- Drawer opens on menu click
- Drawer closes on Escape
- Drawer closes and navigates on thread click

**Sidebar Footer & New Chat:**
- User info in footer
- Settings link visible
- New Chat button visible
- New Chat navigates to /chat

### 4. Playwright config update
Modified `/sidekiq-webapp/playwright.config.ts`:
- Added `sidebar` to `testIgnore` pattern for unauthenticated tests
- Added `sidebar` to `testMatch` pattern for authenticated tests

## Verification

```bash
# Unit tests
pnpm --filter sidekiq-webapp test tests/unit/lib/date-grouping.test.ts tests/unit/hooks/use-sidebar-state.test.ts
# Result: 38 passed

# Full test suite
pnpm --filter sidekiq-webapp test
# Result: 382 passed (all existing + new tests)
```

## Deviations from Plan

None - plan executed exactly as written.

## Test Coverage Summary

| Test File | Tests | Coverage Focus |
|-----------|-------|----------------|
| date-grouping.test.ts | 24 | Date categorization, sorting, edge cases |
| use-sidebar-state.test.ts | 14 | localStorage persistence, toggle, setIsCollapsed |
| sidebar.spec.ts | 16 | Desktop collapse/expand, mobile drawer, navigation |
| **Total** | **54** | Phase 5 sidebar functionality |
