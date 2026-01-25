---
phase: 07-sidekiq-chat-integration
plan: 04
subsystem: ui
tags: [thread-list, sidebar, avatar, visual-indicators, sidekiq]

# Dependency graph
requires:
  - phase: 07-01
    provides: Thread list query with sidekiqId and sidekiq relation data
provides:
  - Sidebar ThreadItem with Sidekiq avatar and "with [name]" subtitle
  - Thread type extended with sidekiq relation fields
  - Deleted Sidekiq graceful handling with placeholder
affects: [07-06, chat-experience, sidebar-display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conditional avatar/pin indicator based on sidekiq presence
    - Deleted Sidekiq graceful degradation with "?" placeholder
    - Type-safe sidekiq relation from schema

key-files:
  created: []
  modified:
    - sidekiq-webapp/src/lib/date-grouping.ts
    - sidekiq-webapp/src/components/thread/thread-item.tsx
    - sidekiq-webapp/src/components/sidebar/sidebar-thread-list.tsx

key-decisions:
  - "Sidekiq avatar replaces pin indicator for Sidekiq threads"
  - "Deleted Sidekiq shows '?' avatar and '[Sidekiq deleted]' subtitle"
  - "Thread type extended in date-grouping.ts for single source of truth"

patterns-established:
  - "Sidekiq thread visual hierarchy: avatar > pin indicator"
  - "Graceful degradation for deleted foreign key references"

# Metrics
duration: 4min
completed: 2026-01-25
---

# Phase 7 Plan 04: Sidebar Visual Indicators Summary

**Sidebar ThreadItem displays Sidekiq avatar with "with [name]" subtitle and handles deleted Sidekiq gracefully**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-25T14:49:26Z
- **Completed:** 2026-01-25T14:53:36Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Extended Thread type with sidekiqId and sidekiq relation fields
- ThreadItem displays Sidekiq avatar instead of pin indicator for Sidekiq threads
- Added "with [Sidekiq name]" subtitle under thread title
- Graceful handling for deleted Sidekiq with "?" placeholder and "[Sidekiq deleted]" text
- Types aligned across date-grouping, ThreadItem, and SidebarThreadList

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Thread type with Sidekiq relation** - `dc1aed7` (feat)
2. **Task 2: Add Sidekiq visual indicators to ThreadItem** - `53b4e7a` (feat)
3. **Task 3: Document Sidekiq data flow in SidebarThreadList** - `e2b1c08` (docs)

## Files Created/Modified
- `sidekiq-webapp/src/lib/date-grouping.ts` - Extended Thread interface with sidekiqId and sidekiq relation
- `sidekiq-webapp/src/components/thread/thread-item.tsx` - Added SidekiqAvatar display, subtitle, and deleted state handling
- `sidekiq-webapp/src/components/sidebar/sidebar-thread-list.tsx` - Added JSDoc documenting sidekiq data flow

## Decisions Made
- Sidekiq avatar takes precedence over pin indicator (visual hierarchy)
- Thread type extended in date-grouping.ts as the canonical source
- Deleted Sidekiq handled gracefully without crashing - shows placeholder

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- SIDE-06 requirement fulfilled: visual indicator for Sidekiq threads in sidebar
- Ready for 07-05 (Sidekiq chat entry points) and 07-06 (system prompt injection)
- Sidebar now properly distinguishes Sidekiq threads from regular threads

---
*Phase: 07-sidekiq-chat-integration*
*Completed: 2026-01-25*
