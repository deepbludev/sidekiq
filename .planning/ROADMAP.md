# Roadmap: Sidekiq v0.2 Workspaces

## Milestones

- [x] **v0.1 Core Experience** - Phases 1-8.2 (shipped 2026-01-26)
- [ ] **v0.2 Workspaces** - Phases 9-14 (in progress)

## Phases

<details>
<summary>v0.1 Core Experience (Phases 1-8.2) - SHIPPED 2026-01-26</summary>

See: .planning/milestones/v0.1-ROADMAP.md

10 phases, 57 plans, 405 commits.

</details>

### v0.2 Workspaces (In Progress)

**Milestone Goal:** Restructure codebase into vertical feature slices, migrate teams to a unified workspace model with full content isolation, enable Sidekiq sharing within workspaces, and add chat/model enhancements.

**Phase Numbering:**
- Integer phases (9, 10, 11...): Planned milestone work
- Decimal phases (9.1, 10.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 9: Vertical Slice Architecture** - Reorganize codebase from horizontal layers to feature-driven slices
- [ ] **Phase 10: Workspace Schema Migration** - Evolve database from teams to unified workspace model
- [ ] **Phase 11: Workspace Authorization** - Server-side workspace isolation via middleware and route handler scoping
- [ ] **Phase 12: Workspace UX & Members** - Client-side workspace switching, context isolation, and member management
- [ ] **Phase 13: Sidekiq Sharing** - Granular Sidekiq sharing with permissions within workspaces
- [ ] **Phase 14: Chat & Model Enhancements** - Message regeneration and expanded model discovery

## Phase Details

### Phase 9: Vertical Slice Architecture

**Goal:** Codebase organized into self-contained feature slices so that each domain (chat, sidekiq, workspace, auth) owns its components, hooks, server logic, and types in one place.

**Depends on:** Nothing (first phase of v0.2)

**Requirements:**
- ARCH-01: Codebase reorganized into vertical feature slices under `src/features/`
- ARCH-02: Shared cross-cutting utilities moved to `src/shared/`
- ARCH-03: Drizzle schema remains centralized, moved from `src/server/db/schema.ts` to `src/shared/db/schema.ts`
- ARCH-04: tRPC routers moved to feature directories and merged in root router
- ARCH-05: All existing tests pass after restructuring with zero behavior changes

**Success Criteria** (what must be TRUE):
1. Each feature (chat, sidekiq, auth, sidebar, model-picker, settings) has its own directory under `src/features/` containing its components, hooks, server logic, and types
2. Shared utilities (UI primitives, utils, constants) live in `src/shared/` and are imported by multiple features
3. All existing unit and E2E tests pass with zero behavior changes after the restructuring
4. tRPC routers are imported from feature directories and merged into a single root router that serves the same API surface

**Plans:** 6 plans

Plans:
- [x] 09-01-PLAN.md -- Config foundation + shared server infrastructure (db, trpc, lib, env)
- [x] 09-02-PLAN.md -- Shared UI, icons, theme, sidebar layout migration
- [x] 09-03-PLAN.md -- Chats feature slice (components, hooks, router, validations)
- [x] 09-04-PLAN.md -- Sidekiqs + AI feature slices
- [x] 09-05-PLAN.md -- Auth + User + Workspace + Billing feature slices
- [x] 09-06-PLAN.md -- Barrel files, root router wiring, final build verification

**Research flag:** standard -- Well-documented Next.js + FSD pattern. Mechanical file moves with type verification.

---

### Phase 10: Workspace Schema Migration

**Goal:** Database evolved from the team model to a unified workspace model where personal content and team content both live in workspaces, with `workspaceId` on all content tables.

**Depends on:** Phase 9

**Requirements:**
- WKSP-01: Teams table renamed to workspaces with `type` enum (personal/team)
- WKSP-02: Personal workspace auto-created for every user on signup
- WKSP-03: Existing team data migrated to workspace data (preserving all members, invites, Sidekiqs)
- WKSP-04: `workspaceId` added to threads table (all existing threads assigned to user's personal workspace)
- WKSP-05: `workspaceId` replaces `teamId` on sidekiqs table

**Success Criteria** (what must be TRUE):
1. Every user has a personal workspace (type: personal) that was auto-created, and new signups automatically get one
2. All existing team data (members, invites, Sidekiqs) is preserved in workspace tables with no data loss
3. Every thread and Sidekiq in the database has a non-null `workspaceId` pointing to a valid workspace
4. The database schema has workspace and workspace_member tables with proper indexes and foreign keys

**Plans:** 5 plans

Plans:
- [ ] 10-01-PLAN.md -- Schema changes: workspace tables, enums, columns, relations, indexes
- [ ] 10-02-PLAN.md -- Drizzle migration generation, seed script, auth hook for personal workspace
- [ ] 10-03-PLAN.md -- API layer: router, validations, permissions, email rename to workspace
- [ ] 10-04-PLAN.md -- Client components and hooks rename to workspace
- [ ] 10-05-PLAN.md -- Barrel, root router, sidebar, pages wiring + build verification

**Research flag:** researched -- Drizzle rename approach, single migration, explicit workspace_members, clean break.

---

### Phase 11: Workspace Authorization

**Goal:** Server enforces workspace isolation on every data access path so that users can only read and write content within workspaces they belong to.

**Depends on:** Phase 10

**Requirements:**
- WKSP-06: All tRPC queries scoped by `workspaceId` via `workspaceProcedure` middleware
- WKSP-07: `/api/chat` route handler validates workspace membership and assigns `workspaceId` to threads

**Success Criteria** (what must be TRUE):
1. A user who is not a member of a workspace cannot access any threads, messages, or Sidekiqs belonging to that workspace through any tRPC procedure
2. The `/api/chat` route handler rejects requests with an invalid or unauthorized `workspaceId` and all new threads are created with the correct `workspaceId`
3. A shared `validateWorkspaceMembership()` helper is used by both tRPC middleware and the chat route handler, ensuring consistent authorization logic

**Plans:** TBD

**Research flag:** needs-research -- Security-critical phase. Every query across 5+ routers and 8+ chat route DB operations must be audited for workspace filtering. Chat route integration is non-standard (not tRPC).

---

### Phase 12: Workspace UX & Members

**Goal:** Users can switch between their workspaces in the sidebar and see only that workspace's content, and workspace owners can invite, view, and manage members.

**Depends on:** Phase 11

**Requirements:**
- WKSP-08: Sidebar workspace switcher with full context isolation (chats, sidekiqs change on switch)
- WKSP-09: Active workspace persisted in localStorage with fallback to personal workspace
- WKSP-10: TanStack Query cache invalidated on workspace switch
- WKMB-01: Invite members to workspace via email (reuse existing invite infrastructure)
- WKMB-02: View workspace members and roles (owner/admin/member)
- WKMB-03: Remove workspace members
- WKMB-04: Revoke pending workspace invites
- WKMB-05: Workspace invite acceptance flow
- WKMB-06: Personal workspace restricts membership to owner only (no invites)

**Success Criteria** (what must be TRUE):
1. User can switch workspaces via a switcher in the sidebar and immediately see only that workspace's threads and Sidekiqs without a page reload
2. Closing and reopening the browser restores the last active workspace, and if that workspace is no longer valid the app falls back to the personal workspace
3. Workspace owner can invite members via email, view current members with roles, remove members, and revoke pending invites
4. Personal workspace does not show invite or member management options and is restricted to the owner only
5. A user who accepts a workspace invite appears as a member of that workspace and can see its content

**Plans:** TBD

**Research flag:** standard -- React Context + tRPC header injection pattern, existing invite infrastructure reuse.

---

### Phase 13: Sidekiq Sharing

**Goal:** Workspace members can share their Sidekiqs with others in the same workspace, with granular control over what each member can do with a shared Sidekiq.

**Depends on:** Phase 12

**Requirements:**
- SKSH-01: All Sidekiqs in team workspace are shareable with individual members or entire workspace
- SKSH-02: Granular permission levels: use, view, edit per shared Sidekiq
- SKSH-03: Sidekiq owner controls sharing and permissions
- SKSH-04: Personal workspace Sidekiqs are always private (no sharing)
- SKSH-05: Workspace members see shared Sidekiqs in sidebar
- SKSH-06: Starting a chat with a shared Sidekiq creates thread in the active workspace

**Success Criteria** (what must be TRUE):
1. A Sidekiq owner in a team workspace can share their Sidekiq with specific members or the entire workspace, setting use/view/edit permissions per recipient
2. A workspace member who has been granted "use" permission on a shared Sidekiq can start a conversation with it, and that conversation is created in their active workspace
3. Shared Sidekiqs appear in the sidebar's Sidekiq panel for members who have access, visually distinct from the member's own Sidekiqs
4. Sidekiqs in a personal workspace have no sharing UI and cannot be shared
5. Only the Sidekiq owner can modify sharing settings and permission levels

**Plans:** TBD

**Research flag:** needs-research -- Sidekiq permission model UX needs design validation. Which actions require "can edit" vs "can use"? How to display permission state in UI?

---

### Phase 14: Chat & Model Enhancements

**Goal:** Users can regenerate AI responses and select from the full catalog of available models through the AI Gateway.

**Depends on:** Phase 11 (workspace-scoped threads must exist; independent of Phases 12-13)

**Requirements:**
- CHAT-01: Regenerate message button on assistant messages (using AI SDK `regenerate()`)
- CHAT-02: Regeneration replaces last assistant message (no branching)
- CHAT-03: Regenerate button disabled during streaming
- MODL-01: Dynamic model discovery via `gateway.getAvailableModels()` with curation/filter layer
- MODL-02: Model picker shows all available models from the gateway

**Success Criteria** (what must be TRUE):
1. User can click a regenerate button on the last assistant message and receive a new response that replaces the previous one
2. The regenerate button is not clickable while a response is actively streaming
3. The model picker dropdown shows all available models from the AI Gateway, not a hardcoded list
4. User can select any available model from the expanded list and use it in conversation

**Plans:** TBD

**Research flag:** standard -- AI SDK `regenerate()` is a built-in function. `getAvailableModels()` already available in `@ai-sdk/gateway`. No new dependencies.

---

## Coverage

| Category | Requirements | Phase |
|----------|-------------|-------|
| Architecture | ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05 | Phase 9 |
| Workspace Model | WKSP-01, WKSP-02, WKSP-03, WKSP-04, WKSP-05 | Phase 10 |
| Workspace Model | WKSP-06, WKSP-07 | Phase 11 |
| Workspace Model | WKSP-08, WKSP-09, WKSP-10 | Phase 12 |
| Workspace Members | WKMB-01, WKMB-02, WKMB-03, WKMB-04, WKMB-05, WKMB-06 | Phase 12 |
| Sidekiq Sharing | SKSH-01, SKSH-02, SKSH-03, SKSH-04, SKSH-05, SKSH-06 | Phase 13 |
| Chat Enhancements | CHAT-01, CHAT-02, CHAT-03 | Phase 14 |
| Model Management | MODL-01, MODL-02 | Phase 14 |

**Total:** 32 requirements mapped to 6 phases
**Unmapped:** 0

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10 -> 11 -> 12 -> 13 -> 14
(Phase 14 can run in parallel with Phases 12-13 since it only depends on Phase 11)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 9. Vertical Slice Architecture | v0.2 | 6/6 | ✓ Complete | 2026-01-27 |
| 10. Workspace Schema Migration | v0.2 | 0/5 | Planned | - |
| 11. Workspace Authorization | v0.2 | 0/TBD | Not started | - |
| 12. Workspace UX & Members | v0.2 | 0/TBD | Not started | - |
| 13. Sidekiq Sharing | v0.2 | 0/TBD | Not started | - |
| 14. Chat & Model Enhancements | v0.2 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-27*
