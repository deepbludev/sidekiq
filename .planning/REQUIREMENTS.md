# Requirements: Sidekiq v0.2 Workspaces

**Defined:** 2026-01-27
**Core Value:** Users can chat with any LLM through custom assistants (Sidekiqs) that can be shared with their team.

## v0.2 Requirements

Requirements for v0.2 Workspaces milestone. Each maps to roadmap phases.

### Architecture

- [ ] **ARCH-01**: Codebase reorganized into vertical feature slices under `src/features/` (chat, sidekiq, workspace, auth, settings, sidebar, model-picker)
- [ ] **ARCH-02**: Shared cross-cutting utilities moved to `src/shared/` (UI primitives, utils, types, constants)
- [ ] **ARCH-03**: Drizzle schema remains centralized in `src/server/db/schema.ts` with features importing from it
- [ ] **ARCH-04**: tRPC routers moved to feature directories and merged in root router
- [ ] **ARCH-05**: All existing tests pass after restructuring with zero behavior changes

### Workspace Model

- [ ] **WKSP-01**: Teams table renamed to workspaces with `type` enum (personal/team)
- [ ] **WKSP-02**: Personal workspace auto-created for every user on signup
- [ ] **WKSP-03**: Existing team data migrated to workspace data (preserving all members, invites, Sidekiqs)
- [ ] **WKSP-04**: `workspaceId` added to threads table (all existing threads assigned to user's personal workspace)
- [ ] **WKSP-05**: `workspaceId` replaces `teamId` on sidekiqs table
- [ ] **WKSP-06**: All tRPC queries scoped by `workspaceId` via `workspaceProcedure` middleware
- [ ] **WKSP-07**: `/api/chat` route handler validates workspace membership and assigns `workspaceId` to threads
- [ ] **WKSP-08**: Sidebar workspace switcher with full context isolation (chats, sidekiqs change on switch)
- [ ] **WKSP-09**: Active workspace persisted in localStorage with fallback to personal workspace
- [ ] **WKSP-10**: TanStack Query cache invalidated on workspace switch

### Workspace Members

- [ ] **WKMB-01**: Invite members to workspace via email (reuse existing invite infrastructure)
- [ ] **WKMB-02**: View workspace members and roles (owner/admin/member)
- [ ] **WKMB-03**: Remove workspace members
- [ ] **WKMB-04**: Revoke pending workspace invites
- [ ] **WKMB-05**: Workspace invite acceptance flow
- [ ] **WKMB-06**: Personal workspace restricts membership to owner only (no invites)

### Sidekiq Sharing

- [ ] **SKSH-01**: All Sidekiqs in team workspace are shareable with individual members or entire workspace
- [ ] **SKSH-02**: Granular permission levels: use, view, edit per shared Sidekiq
- [ ] **SKSH-03**: Sidekiq owner controls sharing and permissions
- [ ] **SKSH-04**: Personal workspace Sidekiqs are always private (no sharing)
- [ ] **SKSH-05**: Workspace members see shared Sidekiqs in sidebar
- [ ] **SKSH-06**: Starting a chat with a shared Sidekiq creates thread in the active workspace

### Chat Enhancements

- [ ] **CHAT-01**: Regenerate message button on assistant messages (using AI SDK `regenerate()`)
- [ ] **CHAT-02**: Regeneration replaces last assistant message (no branching)
- [ ] **CHAT-03**: Regenerate button disabled during streaming

### Model Management

- [ ] **MODL-01**: Dynamic model discovery via `gateway.getAvailableModels()` with curation/filter layer
- [ ] **MODL-02**: Model picker shows all available models from the gateway

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Workspace Enhancements

- **WKSP-F01**: Workspace-level default model (admin sets default for all members)
- **WKSP-F02**: Workspace settings panel (dedicated settings page beyond reused team settings)
- **WKSP-F03**: Workspace onboarding flow (guided setup with templates)
- **WKSP-F04**: Workspace member activity (who created what, last active time)
- **WKSP-F05**: Cross-workspace Sidekiq sharing (requires isolation architecture rethink)
- **WKSP-F06**: Workspace-level custom instructions
- **WKSP-F07**: Per-workspace billing/usage tracking

### Chat Enhancements

- **CHAT-F01**: Conversation branching (edit creates fork, version history)
- **CHAT-F02**: Message editing
- **CHAT-F03**: Web search tool integration
- **CHAT-F04**: Image generation tool

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Workspace merge (combine personal into team) | ChatGPT's merge is permanent and irreversible — too risky, unnecessary |
| Nested workspaces / sub-workspaces | Extreme complexity for no v0.2 benefit, targets small teams |
| Cross-workspace Sidekiq sharing | Breaks workspace isolation model, requires re-architecture (Slack lesson) |
| Workspace-level billing | No payment system exists yet — defer to payments milestone |
| Workspace admin audit logs | Large UX surface area, defer to admin features milestone |
| Real-time workspace activity feed | Requires WebSocket infrastructure, not core to AI chat value |
| URL-based workspace routing (/w/slug/) | Overkill, breaks existing bookmarks, header-based approach sufficient |
| PostgreSQL Row-Level Security | Application-level isolation sufficient, RLS adds debugging complexity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 9 | Pending |
| ARCH-02 | Phase 9 | Pending |
| ARCH-03 | Phase 9 | Pending |
| ARCH-04 | Phase 9 | Pending |
| ARCH-05 | Phase 9 | Pending |
| WKSP-01 | Phase 10 | Pending |
| WKSP-02 | Phase 10 | Pending |
| WKSP-03 | Phase 10 | Pending |
| WKSP-04 | Phase 10 | Pending |
| WKSP-05 | Phase 10 | Pending |
| WKSP-06 | Phase 11 | Pending |
| WKSP-07 | Phase 11 | Pending |
| WKSP-08 | Phase 12 | Pending |
| WKSP-09 | Phase 12 | Pending |
| WKSP-10 | Phase 12 | Pending |
| WKMB-01 | Phase 12 | Pending |
| WKMB-02 | Phase 12 | Pending |
| WKMB-03 | Phase 12 | Pending |
| WKMB-04 | Phase 12 | Pending |
| WKMB-05 | Phase 12 | Pending |
| WKMB-06 | Phase 12 | Pending |
| SKSH-01 | Phase 13 | Pending |
| SKSH-02 | Phase 13 | Pending |
| SKSH-03 | Phase 13 | Pending |
| SKSH-04 | Phase 13 | Pending |
| SKSH-05 | Phase 13 | Pending |
| SKSH-06 | Phase 13 | Pending |
| CHAT-01 | Phase 14 | Pending |
| CHAT-02 | Phase 14 | Pending |
| CHAT-03 | Phase 14 | Pending |
| MODL-01 | Phase 14 | Pending |
| MODL-02 | Phase 14 | Pending |

**Coverage:**
- v0.2 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-27 after roadmap creation*
