---
phase: 03-thread-management
plan: 05
subsystem: ui
tags: [next.js, metadata, ssr, trpc, browser-title, polling]

# Dependency graph
requires:
  - phase: 03-02
    provides: Thread auto-title generation via fire-and-forget
provides:
  - SSR browser tab title via generateMetadata
  - getTitle tRPC query for title polling
  - Dynamic document.title updates on new threads
affects: [sidebar, user-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "generateMetadata for dynamic SSR titles"
    - "tRPC polling with refetchInterval for async state"

key-files:
  created: []
  modified:
    - sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx
    - sidekiq-webapp/src/components/chat/chat-interface.tsx
    - sidekiq-webapp/src/server/api/routers/thread.ts
    - sidekiq-webapp/src/lib/validations/thread.ts

key-decisions:
  - "Next.js generateMetadata for SSR title (deduplicates query with page component)"
  - "Title polling every 2s, max 5 attempts (10s timeout)"
  - "document.title updated via useEffect when title changes"

patterns-established:
  - "generateMetadata pattern: async function for dynamic SSR metadata"
  - "Polling pattern: enabled when needed, refetchInterval returns false when done"

# Metrics
duration: 2min
completed: 2026-01-23
---

# Phase 03 Plan 05: Browser Tab Title Fix Summary

**Browser tab displays thread title via SSR generateMetadata and polls for title after new thread creation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-23T14:26:24Z
- **Completed:** 2026-01-23T14:28:49Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Browser tab shows thread title for existing threads on initial load (SSR)
- Browser tab shows "New Chat - Sidekiq" for untitled threads
- Browser tab updates dynamically when title is generated (polling)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add generateMetadata and pass title to ChatInterface** - `e111aa7` (feat)
2. **Task 2: Add getTitle tRPC query and title polling to ChatInterface** - `77de4ad` (feat)

## Files Created/Modified
- `sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx` - Added generateMetadata for SSR title, passes initialTitle to ChatInterface
- `sidekiq-webapp/src/components/chat/chat-interface.tsx` - Accepts initialTitle prop, polls for title via tRPC, updates document.title
- `sidekiq-webapp/src/server/api/routers/thread.ts` - Added getTitle query for title polling
- `sidekiq-webapp/src/lib/validations/thread.ts` - Added getTitleInputSchema

## Decisions Made
- Used Next.js generateMetadata for SSR title (automatically deduplicates query with page component)
- Polling interval of 2 seconds with max 5 attempts (10 second total timeout)
- document.title updated via useEffect hook when currentTitle state changes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation followed plan specifications.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Browser tab title feature complete
- Phase 03 (Thread Management) gap closure complete
- Ready to proceed with Phase 04 (Model Selection & Persistence)

---
*Phase: 03-thread-management*
*Completed: 2026-01-23*
