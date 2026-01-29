# Phase 11: Workspace Authorization - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Server enforces workspace isolation on every data access path so that users can only read and write content within workspaces they belong to. Covers tRPC middleware (`workspaceProcedure`), `/api/chat` route handler validation, and a shared `validateWorkspaceMembership()` helper. Also includes client-side workspace header injection so the system is testable end-to-end.

</domain>

<decisions>
## Implementation Decisions

### Violation behavior
- Log unauthorized access attempts with userId, workspaceId, and timestamp for security auditing
- When a user's workspace becomes unavailable (deleted or removed), show a brief toast notification ("Workspace no longer available") then redirect to personal workspace
- Claude's Discretion: Error response format (generic 403 vs specific message) — pick based on security best practices
- Claude's Discretion: Whether to include role-based checks (owner/admin/member) in this phase or defer to Phase 12/13

### Workspace context flow
- All data queries are scoped to the active workspace — workspace list uses a separate unscoped endpoint (strict single workspace at a time)
- Workspace switching only requires re-fetching data, no re-authentication
- Phase 11 implements both server-side middleware AND client-side header injection for end-to-end testability
- Claude's Discretion: Header injection vs URL params vs session storage for passing workspace ID to server
- Claude's Discretion: Whether workspace middleware runs on every tRPC call or only workspace-scoped procedures
- Claude's Discretion: Startup validation approach (validate stored workspace ID first vs optimistic)
- Claude's Discretion: Client-side workspace ID source for Phase 11 (localStorage with fallback vs hardcoded personal)
- Claude's Discretion: Whether missing workspace ID falls back to personal workspace or returns an error
- Claude's Discretion: Whether tRPC and /api/chat share the same header name and parsing logic

### Personal workspace rules
- If personal workspace is missing (e.g., race condition during signup), auto-create it on the fly during auth check — self-healing
- Personal workspace is strictly single-user — no additional members ever (no support access, no admin impersonation)
- Claude's Discretion: Whether personal workspace goes through same membership middleware or bypasses it
- Claude's Discretion: Whether admin APIs can access personal workspace content

### Chat route integration
- Thread's workspaceId must strictly match the request's workspaceId — no cross-workspace thread access
- Claude's Discretion: Whether to validate workspace membership on every message or only on thread creation
- Claude's Discretion: Error response format for invalid/missing workspaceId (JSON body vs bare HTTP status)
- Claude's Discretion: Whether to interrupt an active stream if user is removed from workspace mid-generation

### Claude's Discretion
- Error response format for authorization failures (generic vs specific)
- Role-based checks scope (this phase vs deferred)
- Workspace context transport mechanism (header vs URL vs session)
- Middleware granularity (all procedures vs only scoped ones)
- Missing workspace ID fallback behavior
- Shared parsing logic between tRPC and chat route
- Personal workspace middleware bypass decision
- Chat route validation frequency (every message vs thread creation only)
- Stream interruption policy on membership revocation

</decisions>

<specifics>
## Specific Ideas

- User explicitly wants end-to-end testability — both server middleware and client-side header injection in this phase, not split across phases
- Strict workspace isolation: no multi-workspace queries in a single page load (workspace list is a separate unscoped concern)
- Thread-to-workspace matching must be strict — if a thread belongs to workspace A, you cannot access it from workspace B's context
- Personal workspace auto-creation as a self-healing mechanism rather than failing on missing workspace

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-workspace-authorization*
*Context gathered: 2026-01-29*
