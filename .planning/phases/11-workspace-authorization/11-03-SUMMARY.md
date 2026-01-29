---
phase: 11-workspace-authorization
plan: 03
subsystem: auth
tags: [workspace, authorization, chat-route, ssr, query-invalidation, validateWorkspaceMembership]

# Dependency graph
requires:
  - phase: 11-01
    provides: validateWorkspaceMembership() shared helper, x-workspace-id header injection in tRPC client and chat transport
provides:
  - Workspace-validated /api/chat route handler reading x-workspace-id header
  - Workspace-validated thread SSR page using membership check instead of userId filter
  - Workspace-validated new chat SSR page with sidekiq workspace membership check
  - Query invalidation on workspace switch (thread.list, sidekiq.list)
affects: [12-role-enforcement, 13-ui-authorization, 14-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Chat route workspace validation: read x-workspace-id header, validate membership, fallback to personal workspace"
    - "SSR workspace inference: infer workspace from data being accessed (thread/sidekiq), validate membership separately"
    - "Query invalidation on workspace switch: void utils.thread.list.invalidate() + void utils.sidekiq.list.invalidate()"

key-files:
  created: []
  modified:
    - sidekiq-webapp/src/app/api/chat/route.ts
    - sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx
    - sidekiq-webapp/src/app/(dashboard)/chat/page.tsx
    - sidekiq-webapp/src/features/workspace/hooks/use-active-workspace.ts

key-decisions:
  - "Chat route uses explicit validation (not resolveWorkspaceId) for HTTP response control -- returns 403 on invalid workspace instead of silent fallback"
  - "SSR pages infer workspace from the data being accessed (thread record / sidekiq record) rather than reading a header"
  - "Thread SSR page removes userId filter from findFirst WHERE clause -- workspace membership replaces direct ownership check"
  - "New chat page strips workspaceId from sidekiq object before passing to ChatInterface (prop type boundary)"
  - "Query invalidation fires on every setActiveWorkspaceId call, not debounced"

patterns-established:
  - "Non-tRPC route workspace validation: read x-workspace-id header -> validateWorkspaceMembership -> 403 or fallback"
  - "SSR page workspace validation: fetch data -> infer workspace from record -> validateWorkspaceMembership -> redirect on failure"
  - "Workspace switch cache management: invalidate workspace-scoped queries in setActiveWorkspaceId callback"

# Metrics
duration: 8min
completed: 2026-01-29
---

# Phase 11 Plan 03: Chat Route and SSR Workspace Authorization Summary

**Workspace authorization on /api/chat route (header-based), thread/new-chat SSR pages (data-inferred), and TanStack Query invalidation on workspace switch**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-29T16:12:18Z
- **Completed:** 2026-01-29T16:20:43Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Chat route now validates workspace membership via x-workspace-id header before any data access, with 403 on invalid workspace and personal workspace fallback when no header is provided
- Existing thread access requires matching workspace (workspaceId check) plus user-level creator check (userId) -- defense in depth
- Sidekiq ownership in chat route changed from ownerId check to workspace membership check
- New threads created with header-provided workspaceId instead of hardcoded personal workspace lookup
- Thread SSR page replaced userId filter with workspace membership validation -- enables future team workspace thread viewing
- New chat SSR page validates sidekiq workspace membership before rendering sidekiq context
- Workspace switch triggers invalidation of thread.list and sidekiq.list TanStack queries

## Task Commits

Each task was committed atomically:

1. **Task 1: Add workspace authorization to chat route handler** - `941b521` (feat)
2. **Task 2: Add workspace validation to SSR pages and wire query invalidation** - `b9055ac` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `sidekiq-webapp/src/app/api/chat/route.ts` - Workspace-validated chat endpoint with x-workspace-id header reading, membership validation, and workspace-scoped sidekiq/thread checks
- `sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx` - Thread SSR page with workspace membership check (replacing userId filter) in both generateMetadata and page component
- `sidekiq-webapp/src/app/(dashboard)/chat/page.tsx` - New chat SSR page with sidekiq workspace membership validation (replacing ownerId/isNull filter)
- `sidekiq-webapp/src/features/workspace/hooks/use-active-workspace.ts` - Query invalidation on workspace switch (thread.list + sidekiq.list)

## Decisions Made
- **Chat route uses explicit validation, not resolveWorkspaceId:** The chat route needs to return HTTP 403 responses (not throw tRPC errors) and has different fallback behavior (403 on invalid workspace, personal workspace only when header is missing). Using explicit validation gives better control over the HTTP response.
- **SSR pages infer workspace from data:** Since SSR pages cannot easily access client-side headers during initial page load, workspace is inferred from the data being accessed (the thread's workspaceId or the sidekiq's workspaceId). This is more robust than relying on header propagation through Next.js.
- **Thread page removes userId filter:** The WHERE clause in the thread findFirst query no longer filters by userId. Access control is now workspace membership-based. This enables future team workspace members to view each other's threads.
- **Chat route keeps both workspace and userId checks on existing threads:** For existing threads, the route checks both workspaceId match AND userId match. The userId check serves as a creator verification within the workspace (defense in depth until role-based access in Phase 12).
- **Query invalidation is not debounced:** Since workspace switches are infrequent user actions, immediate invalidation is appropriate without debouncing overhead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stripped workspaceId from sidekiq prop before passing to ChatInterface**
- **Found during:** Task 2 (new chat page)
- **Issue:** Adding workspaceId to the sidekiq query columns meant the result type included workspaceId, but ChatInterface's sidekiq prop type does not accept workspaceId, causing a type mismatch
- **Fix:** Created a sidekiqForChat intermediate object that explicitly maps only the display fields (id, name, description, avatar, conversationStarters, defaultModel)
- **Files modified:** sidekiq-webapp/src/app/(dashboard)/chat/page.tsx
- **Verification:** npx tsc --noEmit passes, pnpm build succeeds
- **Committed in:** b9055ac (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor type boundary fix needed to pass workspace-enriched query result to a component that only expects display fields. No scope creep.

## Issues Encountered
- Pre-commit lint-staged hook picked up unrelated working tree changes (sidekiqs/api/router.ts from parallel Plan 11-02) during first commit attempt. Resolved by soft-resetting and recommitting with only the intended files staged.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All non-tRPC data access paths are now workspace-protected (chat route, thread SSR page, new chat SSR page)
- Combined with Plan 11-01 (infrastructure) and Plan 11-02 (tRPC router scoping), Phase 11 workspace authorization is complete
- Client-side header injection (11-01) + query invalidation on switch (11-03) provide end-to-end workspace isolation
- Ready for Phase 12 (role-based enforcement) which can leverage workspaceRole from context

---
*Phase: 11-workspace-authorization*
*Completed: 2026-01-29*
