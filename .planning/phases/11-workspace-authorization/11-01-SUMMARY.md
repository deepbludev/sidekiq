---
phase: 11-workspace-authorization
plan: 01
subsystem: auth
tags: [trpc, middleware, workspace, authorization, localStorage, headers]

# Dependency graph
requires:
  - phase: 10-workspace-schema-migration
    provides: workspace/workspaceMembers tables, workspace type enum, personal workspace creation in databaseHooks
provides:
  - validateWorkspaceMembership() shared helper for checking workspace membership
  - resolveWorkspaceId() shared helper with personal workspace fallback and self-healing
  - workspaceProcedure tRPC middleware extending protectedProcedure with workspace context
  - x-workspace-id header injection in tRPC client and chat transport
affects: [11-02 router scoping, 11-03 chat route integration, 12-role-enforcement, 13-ui-authorization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "workspaceProcedure pattern: protectedProcedure.use() with workspace membership validation and context injection"
    - "x-workspace-id header transport: localStorage-based header injection read per-request in both tRPC and fetch"
    - "resolveWorkspaceId fallback chain: header -> validate -> personal workspace -> self-heal"

key-files:
  created:
    - sidekiq-webapp/src/shared/lib/workspace-auth.ts
  modified:
    - sidekiq-webapp/src/shared/trpc/trpc.ts
    - sidekiq-webapp/src/shared/trpc/react.tsx
    - sidekiq-webapp/src/features/chats/components/chat-interface.tsx

key-decisions:
  - "resolveWorkspaceId never throws -- always resolves to a valid workspace via graceful fallback"
  - "Invalid workspace header falls back to personal workspace (not 403) for graceful degradation"
  - "localStorage read per-request inside headers function, not cached in React state"
  - "Self-healing personal workspace creation mirrors databaseHooks pattern exactly"

patterns-established:
  - "workspaceProcedure: use for all workspace-scoped tRPC procedures (thread, sidekiq routers)"
  - "x-workspace-id header: standard header name for workspace context in both tRPC and /api/chat"
  - "validateWorkspaceMembership: shared function for any server code path needing membership check"

# Metrics
duration: 4min
completed: 2026-01-29
---

# Phase 11 Plan 01: Workspace Authorization Infrastructure Summary

**Shared workspace auth helpers (validateWorkspaceMembership + resolveWorkspaceId), workspaceProcedure tRPC middleware, and x-workspace-id header injection in tRPC client and chat transport**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-29T16:03:54Z
- **Completed:** 2026-01-29T16:07:41Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Created `validateWorkspaceMembership()` and `resolveWorkspaceId()` as shared server-side helpers usable by both tRPC middleware and the /api/chat route handler
- Added `workspaceProcedure` to tRPC extending `protectedProcedure` with workspace membership validation and `workspaceId`/`workspaceRole` context injection
- Injected `x-workspace-id` header from localStorage in both the tRPC client (`httpBatchStreamLink`) and the chat transport (`DefaultChatTransport`)
- resolveWorkspaceId implements graceful fallback chain: validate header workspace -> fall back to personal workspace -> self-heal by creating personal workspace if missing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared workspace authorization helper** - `8b6a1e7` (feat)
2. **Task 2: Add workspaceProcedure to tRPC and inject client headers** - `11ebebb` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `sidekiq-webapp/src/shared/lib/workspace-auth.ts` - NEW: exports validateWorkspaceMembership() and resolveWorkspaceId() shared helpers
- `sidekiq-webapp/src/shared/trpc/trpc.ts` - Added workspaceProcedure extending protectedProcedure with workspace context
- `sidekiq-webapp/src/shared/trpc/react.tsx` - Injected x-workspace-id header from localStorage in tRPC client headers function
- `sidekiq-webapp/src/features/chats/components/chat-interface.tsx` - Injected x-workspace-id header from localStorage in DefaultChatTransport

## Decisions Made
- **resolveWorkspaceId never throws:** Always resolves to a valid workspace via graceful degradation (header -> personal -> self-heal), rather than returning 403 errors on missing/invalid headers. This ensures the app works even during initial page loads before localStorage is populated.
- **localStorage read per-request:** The headers function reads directly from `localStorage.getItem()` on every request, not from React state. This ensures workspace switches are immediately reflected in subsequent requests without needing to recreate the tRPC client.
- **Self-healing mirrors databaseHooks exactly:** Personal workspace auto-creation uses the same field values (nanoid, "Personal", type "personal", memberLimit 1, avatar initials #6366f1) as `databaseHooks.user.create.after` in auth config.
- **typeof window guard on client:** Both header injection points include `typeof window !== "undefined"` since the code can run in server-side contexts where localStorage is unavailable.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `workspaceProcedure` is ready for Phase 11 Plan 02 to migrate thread and sidekiq routers from `protectedProcedure` to `workspaceProcedure`
- `validateWorkspaceMembership` and `resolveWorkspaceId` are ready for Phase 11 Plan 03 to integrate workspace validation into the /api/chat route handler
- All client-side header injection is complete -- no further client changes needed for Phase 11

---
*Phase: 11-workspace-authorization*
*Completed: 2026-01-29*
