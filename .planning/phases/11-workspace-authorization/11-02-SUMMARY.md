---
phase: 11-workspace-authorization
plan: 02
subsystem: api
tags: [trpc, workspace, authorization, router, sidekiq, threads]

# Dependency graph
requires:
  - phase: 11-workspace-authorization-01
    provides: workspaceProcedure tRPC middleware with workspaceId/workspaceRole context injection
provides:
  - All 7 thread procedures workspace-scoped (data isolation per workspace)
  - All 7 sidekiq procedures workspace-scoped (data isolation per workspace)
  - Workspace-scoped name uniqueness for sidekiqs
  - New sidekiqs and duplicates created with workspaceId from context
affects: [11-03 chat route integration, 12-role-enforcement, 13-ui-authorization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Workspace-scoped queries: replace userId/ownerId with workspaceId for list/read operations"
    - "Ownership-preserving mutations: workspaceId + userId/ownerId in WHERE clauses for write operations"
    - "Workspace-scoped uniqueness: name uniqueness checks use workspaceId instead of ownerId"

key-files:
  created: []
  modified:
    - sidekiq-webapp/src/features/chats/api/router.ts
    - sidekiq-webapp/src/features/sidekiqs/api/router.ts

key-decisions:
  - "Thread list filters by workspaceId -- team members see all workspace threads (intentional semantics change)"
  - "All thread mutations retain userId check -- only thread creator can modify"
  - "Sidekiq list and getById filter by workspaceId -- any workspace member can view"
  - "All sidekiq mutations retain ownerId check -- only sidekiq creator can modify"
  - "Sidekiq name uniqueness scoped to workspace (not user) to prevent same-name sidekiqs in team workspaces"
  - "Any workspace member can duplicate any workspace sidekiq (not restricted to owner)"
  - "New sidekiqs include workspaceId from ctx (workspace context set at creation time)"

patterns-established:
  - "Query pattern: eq(table.workspaceId, ctx.workspaceId) for read operations"
  - "Mutation pattern: and(eq(table.id, id), eq(table.workspaceId, ctx.workspaceId), eq(table.ownerId/userId, ctx.session.user.id)) for write operations"
  - "Insert pattern: include workspaceId: ctx.workspaceId alongside ownerId: ctx.session.user.id"

# Metrics
duration: 8min
completed: 2026-01-29
---

# Phase 11 Plan 02: Router Workspace Scoping Summary

**All 14 thread and sidekiq tRPC procedures migrated from protectedProcedure to workspaceProcedure with workspace-based filtering and ownership-preserved mutations**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-29T16:12:14Z
- **Completed:** 2026-01-29T16:20:04Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Migrated all 7 thread procedures to workspaceProcedure -- list returns all workspace threads (team shared visibility), mutations enforce thread creator ownership
- Migrated all 7 sidekiq procedures to workspaceProcedure -- list and getById accessible to all workspace members, mutations enforce sidekiq creator ownership
- Scoped sidekiq name uniqueness to workspace (not user) -- prevents duplicate names in team workspaces
- New sidekiqs and duplicated sidekiqs now include workspaceId from context

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate thread router to workspaceProcedure** - `941b521` (feat) -- pre-existing from prior execution
2. **Task 2: Migrate sidekiq router to workspaceProcedure** - `7ae0a24` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `sidekiq-webapp/src/features/chats/api/router.ts` - All 7 thread procedures use workspaceProcedure with workspace-scoped queries and ownership-preserved mutations
- `sidekiq-webapp/src/features/sidekiqs/api/router.ts` - All 7 sidekiq procedures use workspaceProcedure with workspace-scoped queries, name uniqueness, and ownership-preserved mutations

## Decisions Made
- **Thread list semantics change:** `thread.list` now returns all threads in the workspace (not just the requesting user's). In personal workspaces this is equivalent; in team workspaces this enables shared visibility.
- **Sidekiq duplicate accessibility:** Any workspace member can duplicate any workspace sidekiq (the `findFirst` for the original only checks workspaceId, not ownerId). The duplicate is owned by the duplicating user.
- **Thread deletion within sidekiq delete:** Added `eq(threads.workspaceId, ctx.workspaceId)` to the thread deletion branch within sidekiq.delete to ensure workspace isolation even during cascade operations.
- **deletedSidekiqName update not workspace-scoped:** The `deletedSidekiqName` update in sidekiq.delete remains unscoped (updates all threads with the sidekiqId) because the sidekiq itself was already workspace-verified at that point.

## Deviations from Plan

### Pre-existing Work

**Task 1 (thread router) was already completed** by a prior agent execution in commit `941b521` (labeled `feat(11-03)`). The thread router was already migrated to workspaceProcedure with all 7 procedures correctly scoped. This plan execution verified the existing changes match requirements and executed only Task 2 (sidekiq router).

**Task 2 commit included additional files** from the working directory that were modified by a prior agent but not yet committed. The commit `7ae0a24` includes sidekiq router changes alongside SSR page workspace validation and query invalidation on workspace switch. The sidekiq router changes are correct per plan specification.

---

**Total deviations:** 0 auto-fixed issues. Task 1 was pre-completed by prior execution.
**Impact on plan:** No impact -- all success criteria met.

## Issues Encountered
- Build initially failed due to stale `.next/types` cache (missing `forgot-password/page.ts` type file). Resolved by clearing `.next/types` directory. Not related to router changes.
- lint-staged prevented first commit attempt (empty commit after formatting) due to stash/restore cycle. Resolved by using Write tool for full file replacement.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 14 thread and sidekiq procedures are workspace-scoped, ready for Phase 11 Plan 03 (chat route integration)
- `workspaceId` context is available in all procedures for future role-based permission checks (Phase 12)
- Sidekiq name uniqueness enforced at application level per workspace; database unique index migration (`ownerId, LOWER(name)` to `workspaceId, LOWER(name)`) may be needed in a future phase

---
*Phase: 11-workspace-authorization*
*Completed: 2026-01-29*
