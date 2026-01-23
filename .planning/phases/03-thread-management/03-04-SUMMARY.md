---
phase: 03-thread-management
plan: 04
subsystem: ui
tags: [streaming, history-api, react, url-update]

# Dependency graph
requires:
  - phase: 03-02
    provides: Thread creation on first message, X-Thread-Id header
provides:
  - Stream preservation during URL update
  - AI response completes on first message
  - Title auto-generation fires correctly
affects: [none - gap closure for existing functionality]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "URL update without navigation via window.history.replaceState()"

key-files:
  created: []
  modified:
    - "sidekiq-webapp/src/components/chat/chat-interface.tsx"

key-decisions:
  - "Use window.history.replaceState() instead of router.replace() to prevent component unmount during streaming"

patterns-established:
  - "History API for URL updates that must not interrupt ongoing operations"

# Metrics
duration: 2min
completed: 2026-01-23
---

# Phase 03 Plan 04: Stream Abortion Fix Summary

**Fixed stream abortion bug by using window.history.replaceState() instead of router.replace() for URL update during first message**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-23T13:45:25Z
- **Completed:** 2026-01-23T13:47:31Z
- **Tasks:** 2 (1 code change + 1 verification)
- **Files modified:** 1

## Accomplishments
- Stream no longer aborted when URL updates from /chat to /chat/[threadId]
- AI response completes on first message (no second message required)
- onFinish callback fires, enabling title auto-generation
- Removed unused router import for cleaner code

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace router.replace with window.history.replaceState** - `bf457fb` (fix)

**Plan metadata:** (this document)

## Files Modified
- `sidekiq-webapp/src/components/chat/chat-interface.tsx` - Changed URL update mechanism from Next.js router to History API

## Decisions Made
- Used window.history.replaceState() instead of router.replace() - prevents component unmount during streaming
- Removed unused useRouter import and hook call - cleaner code, eliminates lint warning

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused router import causing lint warning**
- **Found during:** Task 1 verification
- **Issue:** After removing router.replace(), the router variable became unused, triggering ESLint warning
- **Fix:** Removed useRouter import and hook call since they're no longer needed
- **Files modified:** sidekiq-webapp/src/components/chat/chat-interface.tsx
- **Verification:** `pnpm lint` passes with no warnings
- **Committed in:** bf457fb (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking - lint warning)
**Impact on plan:** Clean code improvement. No scope creep.

## Issues Encountered
None - fix was straightforward as diagnosed in debug document.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Stream abortion bug is fixed
- First message now triggers complete AI response
- Title auto-generates correctly after first exchange
- Ready to continue with Phase 4 (Model Selection)

## Root Cause Analysis

The bug occurred because `router.replace()` triggers a Next.js navigation, which:
1. Unmounts the current ChatInterface component
2. Mounts a new ChatInterface with the new threadId prop
3. The unmount aborts the ongoing fetch/stream
4. useChat never receives the AI response

The fix uses `window.history.replaceState()` which:
1. Updates the browser URL
2. Does NOT trigger navigation or component lifecycle
3. Stream connection preserved
4. useChat receives full response
5. onFinish fires, title generates

---
*Phase: 03-thread-management*
*Plan: 04 (gap closure)*
*Completed: 2026-01-23*
