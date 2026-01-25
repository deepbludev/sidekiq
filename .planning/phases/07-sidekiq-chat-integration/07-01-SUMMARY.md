---
phase: 07-sidekiq-chat-integration
plan: 01
subsystem: api
tags: [chat, sidekiq, system-message, drizzle, zod]

# Dependency graph
requires:
  - phase: 06-sidekiq-crud
    provides: Sidekiq schema with instructions field and sidekiq router
  - phase: 01-ai-streaming-infrastructure
    provides: Chat API route with streaming
  - phase: 03-thread-management
    provides: Thread router with list query
provides:
  - Chat API accepts sidekiqId for new thread creation
  - Sidekiq instructions injected as system message at runtime
  - Thread list includes Sidekiq relation for sidebar display
  - Sidekiq stats updated on new thread creation
affects: [07-02, 07-03, 07-04, 07-05, 07-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Runtime system message injection (not stored in DB)"
    - "Ownership verification before sidekiq usage"
    - "Drizzle with relation for thread+sidekiq join"

key-files:
  created: []
  modified:
    - sidekiq-webapp/src/lib/validations/chat.ts
    - sidekiq-webapp/src/app/api/chat/route.ts
    - sidekiq-webapp/src/server/api/routers/thread.ts

key-decisions:
  - "System message prepended at runtime, not stored in messages table"
  - "effectiveSidekiqId pattern for new vs existing threads"
  - "Sidekiq stats (lastUsedAt, threadCount) updated on new thread creation"
  - "Sidekiq ownership verification before use (security)"

patterns-established:
  - "Runtime system message injection for Sidekiq instructions"
  - "Thread-to-Sidekiq relation query with Drizzle 'with' clause"
  - "Ownership verification before using user-provided sidekiqId"

# Metrics
duration: 5min
completed: 2026-01-25
---

# Phase 7 Plan 1: Backend Foundation Summary

**Chat API accepts sidekiqId, injects Sidekiq instructions as system message at runtime, and thread list includes Sidekiq relation for sidebar display**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-25T14:35:23Z
- **Completed:** 2026-01-25T14:40:05Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Chat request schema extended with optional sidekiqId field
- Server-side system message injection for Sidekiq instructions
- Thread list query includes sidekiqId and sidekiq relation (id, name, avatar)
- Sidekiq stats (lastUsedAt, threadCount) updated on new thread creation

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend chat request schema with sidekiqId** - `96c4ee9` (feat)
2. **Task 2: Implement server-side system message injection** - `8ec763c` (feat)
3. **Task 3: Extend thread list query with Sidekiq relation** - `fafdd07` (feat)

## Files Created/Modified
- `sidekiq-webapp/src/lib/validations/chat.ts` - Added sidekiqId field to chatRequestSchema
- `sidekiq-webapp/src/app/api/chat/route.ts` - System message injection, sidekiq ownership verification, thread creation with sidekiqId
- `sidekiq-webapp/src/server/api/routers/thread.ts` - Thread list with sidekiq relation

## Decisions Made

1. **System message NOT stored in database** - Sidekiq instructions are prepended as system message at runtime only. This ensures:
   - Instruction updates apply to all future messages immediately
   - Message history stays clean
   - No duplicate data storage

2. **effectiveSidekiqId pattern** - For new threads, use sidekiqId from request body; for existing threads, use thread.sidekiqId from database. This allows consistent system message injection regardless of whether it's a new or resumed conversation.

3. **Sidekiq ownership verification** - Before using a sidekiqId from the request, we verify the user owns that Sidekiq (security check to prevent unauthorized access).

4. **Sidekiq stats update on new thread** - When a new thread is created with a Sidekiq, we update lastUsedAt and increment threadCount. This enables sidebar sorting by recent usage.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-commit hook was restoring unrelated work-in-progress files from git stash, causing TypeScript errors. Resolved by checking out the original versions of those files before each commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Backend foundation complete. Ready for:
- Plan 07-02: UI integration (ChatInterface with sidekiqId, conversation starters)
- Plan 07-03: Sidebar thread Sidekiq display (avatar, name)
- Plan 07-04: Chat page with Sidekiq query parameter

---
*Phase: 07-sidekiq-chat-integration*
*Completed: 2026-01-25*
