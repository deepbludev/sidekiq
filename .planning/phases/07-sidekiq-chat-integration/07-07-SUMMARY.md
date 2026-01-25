---
phase: 07-sidekiq-chat-integration
plan: 07
subsystem: database, ui
tags: [drizzle, schema, thread, sidekiq, gap-closure]

# Dependency graph
requires:
  - phase: 07-04
    provides: Thread item component with deleted Sidekiq placeholder logic
provides:
  - deletedSidekiqName column in threads schema for graceful deletion handling
  - Backend logic to preserve Sidekiq name before deletion
  - UI logic using deletedSidekiqName instead of broken sidekiqId check
affects: [thread-display, sidekiq-deletion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Preserve foreign key context before ON DELETE SET NULL"

key-files:
  created: []
  modified:
    - sidekiq-webapp/src/server/db/schema.ts
    - sidekiq-webapp/src/server/api/routers/sidekiq.ts
    - sidekiq-webapp/src/components/thread/thread-item.tsx
    - sidekiq-webapp/src/lib/date-grouping.ts
    - sidekiq-webapp/src/server/api/routers/thread.ts

key-decisions:
  - "Use deletedSidekiqName column instead of detecting null sidekiqId to handle deleted Sidekiq display"

patterns-established:
  - "Preserve context from FK reference before soft/hard delete for graceful UI degradation"

# Metrics
duration: 3min
completed: 2026-01-25
---

# Phase 7 Plan 7: Fix Deleted Sidekiq Display Summary

**Gap closure: Add deletedSidekiqName column to preserve Sidekiq name in threads when Sidekiq is deleted, fixing broken deleted indicator**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-25T16:25:50Z
- **Completed:** 2026-01-25T16:29:38Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added `deletedSidekiqName` nullable varchar(100) column to threads table
- Updated Sidekiq delete mutation to store Sidekiq name in threads before deletion
- Fixed thread-item UI to use `deletedSidekiqName` instead of broken `sidekiqId && !sidekiq` check
- Updated thread.list query to include `deletedSidekiqName` column

## Task Commits

Each task was committed atomically:

1. **Task 1: Add deletedSidekiqName column to threads schema** - `f7e8ea8` (feat)
2. **Task 2: Update sidekiq.delete mutation to preserve name** - `a0ef3e4` (feat)
3. **Task 3: Update thread-item.tsx UI logic** - `66ed0c8` (feat)

## Files Created/Modified

- `sidekiq-webapp/src/server/db/schema.ts` - Added deletedSidekiqName column to threads table
- `sidekiq-webapp/src/server/api/routers/sidekiq.ts` - Store Sidekiq name in threads before deletion
- `sidekiq-webapp/src/components/thread/thread-item.tsx` - Use deletedSidekiqName for deleted indicator
- `sidekiq-webapp/src/lib/date-grouping.ts` - Added deletedSidekiqName to Thread interface
- `sidekiq-webapp/src/server/api/routers/thread.ts` - Include deletedSidekiqName in list query columns

## Decisions Made

- **Use stored name instead of FK detection:** The existing logic `thread.sidekiqId && !thread.sidekiq` never executed because `ON DELETE SET NULL` clears `sidekiqId` when the Sidekiq is deleted. By storing the Sidekiq name in `deletedSidekiqName` before deletion, we preserve the context needed for graceful UI degradation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **db:push Zod error:** The `pnpm db:push` command failed with a Zod validation error related to the unique index. Worked around by running the ALTER TABLE directly via psql.
- **db:migrate column exists:** The migration file was cumulative and included columns that already existed. Applied the single column addition directly via SQL.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Gap closure complete - deleted Sidekiq indicator now works correctly
- Thread list correctly displays all three states:
  - Active Sidekiq: avatar + "with [name]"
  - Deleted Sidekiq: "?" + "[Sidekiq deleted]"
  - No Sidekiq: pin icon (if pinned) or nothing
- Ready for Phase 8 (Team Sidekiqs) or further verification

---
*Phase: 07-sidekiq-chat-integration*
*Completed: 2026-01-25*
