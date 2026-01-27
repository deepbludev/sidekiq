# Pitfalls Research

**Domain:** Workspace model migration and vertical slice refactor for AI chat app
**Researched:** 2026-01-27
**Confidence:** HIGH (based on codebase analysis + verified domain research)

## Executive Summary

Migrating Sidekiq from horizontal layers with a loosely-scoped team model to vertical feature slices with a workspace-scoped tenancy model is the highest-risk refactor in the project's history. The codebase currently has 170+ TypeScript files organized by technical layer (`components/`, `hooks/`, `server/`, `lib/`) with data owned by `userId` (threads, sidekiqs) and optional `teamId` (sidekiqs only). The migration requires simultaneously:

1. Restructuring files from horizontal layers to vertical feature slices
2. Adding `workspaceId` to every content table and backfilling existing data
3. Changing authorization from user-ownership to workspace-membership checks
4. Updating every tRPC query to scope by workspace instead of (or in addition to) user
5. Redesigning the sidebar and navigation for workspace switching

Each of these is individually risky. Doing them together multiplies the risk. The pitfalls below are ordered by severity and annotated with specific references to the existing Sidekiq codebase.

---

## Critical Pitfalls

Mistakes that cause data leaks, lost data, broken authorization, or require significant rework.

### Pitfall 1: Forgetting `workspaceId` in Even One Query (Data Leak)

**What goes wrong:**
After adding `workspaceId` to tables, one or more queries continue to filter only by `userId` or have no workspace filter at all. Users in Workspace A can see threads or Sidekiqs belonging to Workspace B. This is a **data isolation failure** -- the single most critical security issue in multi-tenant systems.

**Why it happens:**
- The current codebase has ~30+ queries across 5 router files that filter by `userId` (e.g., `eq(threads.userId, ctx.session.user.id)`). Every single one needs updating.
- The `/api/chat/route.ts` endpoint performs 8+ database operations, each needing workspace scoping.
- The `sidekiq.list` procedure currently filters `eq(sidekiqs.ownerId, ctx.session.user.id)` -- this must change to workspace-scoped, but the developer might only update it to include `workspaceId` without removing the `ownerId` check, breaking shared workspace Sidekiqs.
- New procedures added during the refactor might default to the old `userId`-only pattern.

**Specific Sidekiq code at risk:**
```
src/server/api/routers/thread.ts   -- 7 queries using eq(threads.userId, ...)
src/server/api/routers/sidekiq.ts  -- 8 queries using eq(sidekiqs.ownerId, ...)
src/app/api/chat/route.ts          -- 5 queries (thread ownership, sidekiq ownership)
```

**How to avoid:**
1. Create a `workspaceProcedure` tRPC middleware that resolves the active workspace from context and injects `workspaceId` into `ctx`. Every workspace-scoped query uses `ctx.workspaceId` -- never a raw parameter.
2. Write a lint rule or review checklist: every `db.query` and `db.select` call on a workspace-scoped table MUST include `eq(table.workspaceId, ctx.workspaceId)`.
3. Add integration tests that create two workspaces and verify data isolation for every endpoint.
4. After migration, do a full-codebase grep for queries on workspace-scoped tables that lack `workspaceId` in their WHERE clause.

**Warning signs:**
- During code review, any query on `threads`, `sidekiqs`, or `messages` that does not reference `workspaceId`.
- Tests pass with a single workspace but fail when a second workspace is introduced.
- Users report seeing content they did not create.

**Phase to address:** Must be solved in the workspace schema migration phase, before any workspace features ship. The `workspaceProcedure` middleware should be the FIRST thing built.

---

### Pitfall 2: Botched Data Migration (NOT NULL on Existing Rows)

**What goes wrong:**
The schema adds `workspaceId TEXT NOT NULL REFERENCES workspace(id)` to the `thread`, `sidekiq`, and `message` tables. PostgreSQL rejects the migration because existing rows have no `workspaceId` value. The developer either:
- Makes the column nullable (losing the NOT NULL guarantee forever)
- Tries to set a default that references a workspace that doesn't exist yet
- Runs the migration on production without testing, causing downtime

**Why it happens:**
- Drizzle Kit's `generate` command produces a single `ALTER TABLE ADD COLUMN ... NOT NULL` statement that fails on tables with existing data.
- Drizzle Kit does not generate backfill SQL or multi-step migrations automatically.
- The existing database has threads, messages, and sidekiqs that must be assigned to workspaces.

**Specific Sidekiq impact:**
- The `thread` table has rows with `userId` but no workspace concept.
- The `sidekiq` table has rows with `ownerId` and optional `teamId`.
- The `message` table has rows linked to threads only.
- Each existing user needs a personal workspace created, and their content assigned to it.
- Sidekiqs with `teamId` need to be assigned to the corresponding workspace (if team becomes workspace).

**How to avoid:**
Follow the expand-and-contract migration pattern with 5+ migration steps:

1. **Migration 1:** Create the `workspace` and `workspace_member` tables. Insert a personal workspace for every existing user. Insert team-based workspaces for every existing team.
2. **Migration 2:** Add `workspace_id` as a NULLABLE column (no NOT NULL yet) to `thread`, `sidekiq`.
3. **Migration 3 (custom SQL):** Backfill `workspace_id` for all existing rows:
   - Threads: set `workspace_id` to the personal workspace of `thread.userId`.
   - Sidekiqs without `teamId`: set to personal workspace of `sidekiq.ownerId`.
   - Sidekiqs with `teamId`: set to the workspace that replaced that team.
4. **Migration 4 (custom SQL):** Add the foreign key constraint with `NOT VALID`, then `VALIDATE CONSTRAINT` separately. This avoids locking both tables during validation.
5. **Migration 5 (custom SQL):** `ALTER COLUMN workspace_id SET NOT NULL`.
6. **Update Drizzle schema:** Change the column definition to `.notNull()`.

Use `drizzle-kit generate --custom` to create blank migration files for steps 3-5.

**Warning signs:**
- Migration fails in CI/CD or staging with "column cannot be null" errors.
- Developer skips NOT NULL and ships nullable `workspaceId` -- this guarantees future data isolation bugs.
- Backfill script doesn't handle edge cases (users with no threads, deleted teams, orphaned sidekiqs).

**Phase to address:** Workspace schema migration phase. This must be the most carefully planned and tested part of the entire milestone.

---

### Pitfall 3: Breaking tRPC Type Inference During Vertical Slice Move

**What goes wrong:**
Moving files from `src/server/api/routers/thread.ts` to `src/features/thread/server/router.ts` (or similar) breaks TypeScript path resolution and tRPC's automatic type inference. The `AppRouter` type exported from `root.ts` no longer matches the actual router structure. Frontend `api.thread.list.useQuery()` calls show type errors or, worse, silently break at runtime. The entire type-safe chain from Drizzle schema to tRPC router to React Query hook is severed.

**Why it happens:**
- tRPC's type inference depends on the precise export chain: `root.ts` imports routers, the `AppRouter` type is inferred from `createTRPCRouter()`, and the frontend client consumes `AppRouter`.
- Moving router files changes import paths. If the re-export in `root.ts` is incorrect, the type chain breaks silently in some configurations.
- Path aliases (`@sidekiq/server/api/routers/thread`) may or may not update automatically depending on IDE and build tooling.
- Barrel files (`index.ts`) introduced during refactoring can create circular dependency issues that break tRPC's type inference.

**Specific Sidekiq risk:**
- `src/server/api/root.ts` imports from `./routers/thread`, `./routers/sidekiq`, `./routers/team`, `./routers/user`, `./routers/health`. All five must be moved consistently.
- The `@sidekiq/` path alias in `tsconfig.json` is configured for `src/*`. Feature-based paths need new aliases or barrel re-exports.
- `src/trpc/react.tsx` creates the client typed against `AppRouter`. Any break in the type chain cascades here.

**How to avoid:**
1. **Move files ONE router at a time**, not all at once. Move `thread` router to new location, update `root.ts` import, verify types compile, verify frontend queries work, then proceed to the next router.
2. **Keep `root.ts` as the single composition point.** The router composition file should not move -- only the files it imports from change location.
3. **Add a CI type-check step** that runs `tsc --noEmit` and catches broken inference before merge.
4. **Do NOT use barrel files for routers.** Import each router directly to avoid circular dependency issues.
5. **Test the full chain** after each move: write a quick test that calls `api.thread.list.useQuery` and verifies the return type matches expectations.

**Warning signs:**
- TypeScript errors mentioning "Property 'thread' does not exist on type 'AppRouter'".
- Runtime errors like "Cannot read properties of undefined (reading 'list')".
- Frontend compiles but all tRPC queries return `undefined` or throw at runtime.
- Build succeeds locally but fails in CI (different TypeScript resolution settings).

**Phase to address:** Vertical slice restructuring phase, BEFORE the workspace migration. Restructure first while behavior is stable, then change behavior.

---

### Pitfall 4: Personal Workspace Identity Crisis

**What goes wrong:**
The system creates a "personal workspace" for each user, but it behaves inconsistently with team workspaces. Personal workspaces might:
- Allow inviting members (they shouldn't, or should they?)
- Have a different permission model than team workspaces
- Show settings that don't apply (member management, workspace name editing)
- Not appear in the workspace switcher (making it confusing which workspace is active)
- Have a "null workspace" state that code has to handle everywhere

**Why it happens:**
- The team decides personal workspaces are "just like team workspaces but with one member" but doesn't enforce this consistently.
- Some code paths treat "no workspace selected" as "personal workspace," creating null-check ambiguity.
- The personal workspace has special behavior (auto-created, can't be deleted, always exists) that breaks assumptions made for regular workspaces.
- UI design treats personal vs. team contexts differently but the data model doesn't reflect this.

**Specific Sidekiq risk:**
- The current `useActiveTeam` hook returns `null` for "no team selected" (personal context). If this pattern continues, every component must handle `workspaceId: string | null`, which means every query needs two code paths.
- The existing `sidekiq.list` queries filter by `ownerId`. In a personal workspace, ownership and workspace membership are the same thing. In a team workspace, they diverge. This semantic difference is easy to get wrong.
- Current code in `use-active-team.ts` stores `activeTeamId` in localStorage. If migrated to `activeWorkspaceId`, the null state needs explicit handling for personal workspace.

**How to avoid:**
1. **Make personal workspace a REAL workspace entity in the database.** It has an ID, a row in the `workspace` table, and a single member (the owner). No null states.
2. **Use a `type` column on the workspace table:** `'personal' | 'team'`. Conditional logic uses `workspace.type`, not "is workspaceId null?"
3. **Auto-create on user signup.** The personal workspace is created in the same transaction as the user account. It always exists.
4. **Auto-select on login.** If no workspace is stored in localStorage, default to the personal workspace (not null).
5. **Restrict operations by type:** Personal workspaces cannot have members invited. Team workspaces can. Use the `type` field to gate UI and API.

**Warning signs:**
- Components have `if (!workspaceId) { /* personal mode */ }` branches that diverge significantly from the workspace path.
- Tests frequently need to handle "null workspace" as a special case.
- Users confused about which workspace they're in.
- Data created in "personal mode" doesn't show up when switching to personal workspace.

**Phase to address:** Workspace schema design phase. The personal workspace entity must be defined before any migration code is written.

---

### Pitfall 5: Authorization Model Not Updated for Workspace Ownership

**What goes wrong:**
The current authorization model is simple: you own your data (threads, sidekiqs), verified by `userId` checks. In a workspace model, authorization becomes: you can access data that belongs to workspaces you're a member of. But the code only adds `workspaceId` to queries without updating the permission model. Results:
- User creates a Sidekiq in Team Workspace, then leaves the team -- Sidekiq is orphaned or still accessible.
- User in Workspace A crafts a request with Workspace B's ID and gets access (no membership check).
- Ownership checks (`eq(sidekiqs.ownerId, ctx.session.user.id)`) remain, preventing workspace members from seeing shared Sidekiqs.

**Why it happens:**
- The existing `team-permissions.ts` has role-based checks but they're team-specific, not workspace-generic.
- Adding `workspaceId` to queries feels like "adding tenancy" but without membership verification it's just a filter parameter that can be spoofed.
- The `protectedProcedure` middleware only checks authentication, not workspace authorization.
- The chat route (`/api/chat/route.ts`) does manual ownership checks that need to become workspace membership checks.

**Specific Sidekiq code at risk:**
```typescript
// Current: simple ownership
eq(sidekiqs.ownerId, ctx.session.user.id)

// WRONG migration: adds workspaceId but trusts client-provided value
eq(sidekiqs.workspaceId, input.workspaceId) // Client can send any workspaceId!

// CORRECT: verify membership, then scope by workspace
const membership = await verifyWorkspaceMembership(ctx.session.user.id, input.workspaceId);
if (!membership) throw new TRPCError({ code: 'FORBIDDEN' });
// Now scope queries by the verified workspaceId
```

**How to avoid:**
1. **Create a `workspaceProcedure` middleware** that:
   - Reads `workspaceId` from request input or session context
   - Verifies the user is an active member of that workspace
   - Injects the verified `workspaceId` into context
   - Throws FORBIDDEN if membership check fails
2. **Replace `protectedProcedure` with `workspaceProcedure`** for all workspace-scoped routes. Keep `protectedProcedure` only for user-level operations (profile, preferences).
3. **Migrate `team-permissions.ts` to `workspace-permissions.ts`** with workspace-aware role checks.
4. **The chat route needs special attention:** It's a raw Next.js route handler, not a tRPC procedure. It must perform workspace membership verification manually.

**Warning signs:**
- Any tRPC procedure that takes `workspaceId` as input without verifying membership.
- The chat route at `/api/chat/route.ts` still only checks `userId` ownership.
- Tests pass because they only test the happy path (user accesses their own workspace).

**Phase to address:** Must be implemented alongside the workspace schema. The `workspaceProcedure` middleware is a prerequisite for all workspace-scoped routes.

---

## Technical Debt Patterns

### Pattern 1: Half-Migrated Authorization (userId AND workspaceId)

**What goes wrong:** During incremental migration, some queries check both `userId` and `workspaceId` while others check only one. The codebase has inconsistent authorization semantics.

**How this manifests in Sidekiq:**
The thread router currently has 7 queries all checking `eq(threads.userId, ctx.session.user.id)`. During migration, some get updated to check `workspaceId` while others still check `userId`. Result: some features work in personal workspace only, others work in team workspace only.

**Prevention:** Define a clear migration plan: ALL workspace-scoped routes migrate together in one phase. No "partial migration" where threads use workspaceId but sidekiqs still use userId.

### Pattern 2: Duplicated Feature Logic Across Slices

**What goes wrong:** During vertical slice restructuring, shared logic (e.g., date grouping for sidebar threads, avatar rendering) gets copied into each feature slice instead of being properly shared.

**How this manifests in Sidekiq:**
- `src/lib/date-grouping.ts` is used by both thread list and sidekiq list components.
- `src/lib/sidebar-utils.ts` has shared sidebar logic.
- `SidekiqAvatar` interface is used by both sidekiqs and teams.
- If each feature slice copies these, updates need to happen in multiple places.

**Prevention:** Create a `src/shared/` or `src/lib/` directory for genuinely cross-cutting utilities. The rule: if 3+ feature slices need it, it goes in shared. If only 1-2 slices use it, it stays in the slice.

### Pattern 3: Circular Import Between Feature Slices

**What goes wrong:** The thread feature slice imports from the sidekiq feature slice (to show sidekiq avatars on threads), and the sidekiq feature slice imports from the thread slice (to show thread count). Circular dependency.

**How this manifests in Sidekiq:**
- `threadRelations` references `sidekiqs` table.
- `sidekiqRelations` references `threads` table (via thread count).
- Thread sidebar items show sidekiq avatars (imports sidekiq component).
- Sidekiq detail page shows related threads (imports thread component).

**Prevention:** Keep the Drizzle schema in a single shared file (do not split schema per feature). For UI components, use a shared `AvatarDisplay` component in `src/shared/ui/` rather than importing across slices. For data, use tRPC's `with` relation queries rather than cross-slice imports.

---

## Integration Gotchas

### Gotcha 1: localStorage `activeTeamId` Breaks After Migration

**What goes wrong:** Users have `sidekiq-active-team-id` stored in localStorage from the current team system. After migrating to workspaces, the stored team ID no longer matches any workspace ID (if IDs change) or the key name changes. Users get stuck with no active workspace, seeing empty states or errors.

**Specific code:** `src/hooks/use-active-team.ts` line 7: `const ACTIVE_TEAM_KEY = "sidekiq-active-team-id";`

**How to avoid:**
- If reusing team IDs as workspace IDs, keep reading the old key as a fallback.
- Add migration logic in the hook: if old key exists and new key doesn't, convert and store the new key.
- Always fall back to the personal workspace if the stored ID is invalid.

### Gotcha 2: The Chat Route Is Not a tRPC Procedure

**What goes wrong:** All other data operations go through tRPC routers, which will get workspace middleware. But `/api/chat/route.ts` is a raw Next.js API route. It does NOT get workspace middleware automatically. If the developer focuses on migrating tRPC routers and forgets this route, the most critical endpoint (chat) has no workspace scoping.

**Specific code:** `src/app/api/chat/route.ts` performs 8+ database operations:
- Thread creation (line 149)
- Thread ownership check (line 118-129)
- Sidekiq ownership check (line 91-109)
- Message insertion (line 193)
- Thread update (line 276-283)
- Sidekiq stats update (line 172-179)
- Thread title generation (line 286-301)

Each of these needs workspace scoping.

**How to avoid:**
- Extract a `resolveWorkspaceContext()` utility that both tRPC middleware and the chat route can use.
- Add workspace membership verification at the top of the chat route POST handler.
- Consider migrating the chat endpoint to use a tRPC mutation for the non-streaming parts (thread creation, message persistence) while keeping streaming as a raw route.

### Gotcha 3: Sidebar Component Explosion

**What goes wrong:** The sidebar has 12 files totaling 1,587 lines. Adding workspace switching means adding a workspace switcher component, modifying the icon rail, updating panel content for workspace context, and potentially adding workspace-specific panels. Without careful refactoring, the sidebar becomes a 2,500+ line mess.

**Specific files at risk:**
- `sidebar-icon-rail.tsx` -- needs workspace switcher in the icon rail
- `sidebar-panel-teams.tsx` -- may become `sidebar-panel-workspaces.tsx`
- `sidebar-panel-chats.tsx` -- needs to filter by active workspace
- `sidebar-panel-sidekiqs.tsx` -- needs to show workspace's sidekiqs

**How to avoid:**
- Refactor the sidebar AFTER vertical slice restructuring (so it's already better organized).
- Keep the workspace switcher as an isolated component that emits a `workspaceId` change event.
- Use React Context for the active workspace rather than prop-drilling through 12 sidebar components.

### Gotcha 4: Drizzle Relations Don't Auto-Update

**What goes wrong:** The Drizzle ORM `relations()` definitions in `schema.ts` need updating for the new workspace model. The existing `teamRelations`, `sidekiqRelations`, and `threadRelations` reference `teams`. These must be updated to reference `workspace`. But Drizzle doesn't warn you if relations are stale -- queries using `.with()` silently return wrong data or empty arrays.

**Specific code:** Lines 330-372 of `src/server/db/schema.ts` define all relations. These must all be audited.

**How to avoid:**
- Update relations in the same commit as the schema changes.
- Write integration tests that query using `.with()` and verify the expected join results.
- Review every `db.query.*.findMany({ with: { ... } })` call in the codebase.

---

## Performance Traps

### Trap 1: N+1 Queries from Workspace Membership Checks

**What goes wrong:** The new `workspaceProcedure` middleware runs a database query to verify membership on EVERY tRPC call. For a page that makes 5 tRPC calls (thread list, sidekiq list, workspace info, user profile, team members), that's 5 extra membership queries.

**How to avoid:**
- Cache workspace membership in the tRPC context (created once per request in `createTRPCContext`).
- If the session already contains workspace info, avoid a separate query.
- Use `IN (SELECT workspace_id FROM workspace_member WHERE user_id = ?)` subqueries instead of separate membership lookups.
- Consider adding `activeWorkspaceId` to the session token itself (if using Better Auth, check if custom session fields are supported).

### Trap 2: Missing Indexes on workspaceId Columns

**What goes wrong:** After adding `workspace_id` to `thread`, `sidekiq`, and `message` tables, every query now filters by `workspace_id`. Without indexes, these queries do sequential scans. With 10k+ threads across all workspaces, this causes noticeable latency.

**How to avoid:**
- Add `index("thread_workspace_idx").on(t.workspaceId)` to every workspace-scoped table.
- Add composite indexes for common query patterns: `index("thread_workspace_activity_idx").on(t.workspaceId, t.lastActivityAt)`.
- The existing `thread_user_idx` on `userId` may become redundant if queries always filter by `workspaceId` first. Review and potentially drop.

### Trap 3: Backfill Migration Locks Table for Duration

**What goes wrong:** A single `UPDATE thread SET workspace_id = (subquery) WHERE workspace_id IS NULL` on a table with 100k+ rows acquires a lock for the entire duration. During this time, the app cannot write to the thread table. Users experience errors or timeouts.

**How to avoid:**
- Batch the backfill: update 1000 rows at a time with a `LIMIT` and loop until done.
- Run the backfill OUTSIDE the migration transaction (use `drizzle-kit generate --custom`).
- Schedule the migration during a maintenance window if the table is large.
- For Sidekiq's current scale (likely <100k rows), a single UPDATE is probably fine, but build the batch pattern anyway for good habits.

---

## Security Mistakes

### Mistake 1: Workspace ID in URL Without Server Verification

**What goes wrong:** The frontend sends `workspaceId` as a query parameter or in the request body. The backend trusts it without checking membership. Attacker changes the workspace ID in the browser's network tab and accesses another workspace's data.

**How to avoid:** NEVER trust client-provided `workspaceId` without server-side membership verification. The `workspaceProcedure` middleware must verify on every request.

### Mistake 2: Leaving Old userId-Only Routes Active

**What goes wrong:** After adding workspace-scoped routes, the old routes that filter by `userId` only are not removed. An attacker discovers the old route still works and bypasses workspace isolation entirely.

**How to avoid:** When migrating a route to workspace scoping, remove or deprecate the old version. Do not keep both active.

### Mistake 3: Workspace Enumeration via Invite System

**What goes wrong:** The existing team invite system at `src/app/invite/[token]/` reveals team names and avatars to anyone with the invite URL. In a workspace model, this could leak workspace existence and membership information.

**How to avoid:** Rate-limit invite token lookups. Only reveal workspace name after email verification matches.

---

## UX Pitfalls

### UX Pitfall 1: Workspace Context Confusion ("Where Is My Stuff?")

**What goes wrong:** User creates a thread in their personal workspace, then switches to a team workspace and can't find it. They think the thread was deleted. They switch back to personal workspace and find it. Repeat frustration 10x. Users don't understand that content is scoped to workspaces.

**How to avoid:**
- Show a clear workspace indicator in the header/sidebar at all times (e.g., "Personal" or team name + avatar).
- When switching workspaces, show a brief transition indicator: "Switching to [Workspace Name]..."
- If a user searches for content, search across ALL their workspaces and show which workspace each result belongs to.
- On first use after migration, show an onboarding tooltip explaining workspace scoping.

### UX Pitfall 2: Workspace Switching Loses Draft State

**What goes wrong:** User is composing a message in Workspace A, then accidentally (or intentionally) switches to Workspace B. Their draft message is lost. The chat input had text, model selection, and possibly a Sidekiq selected -- all gone.

**How to avoid:**
- Persist draft state per workspace (e.g., in localStorage keyed by `workspace_id`).
- Warn users before switching if there's an active draft: "You have an unsent message. Switch anyway?"
- On switch back, restore the draft state.

### UX Pitfall 3: Empty State Overload After Migration

**What goes wrong:** After migration, users open the app and see their personal workspace with all their existing threads. But when they click on a team workspace, it's empty (no threads yet). Every panel shows empty states. The app feels broken or like data was lost.

**How to avoid:**
- For team workspaces migrated from existing teams: migrate shared Sidekiqs into the workspace so it's not completely empty.
- Show encouraging empty states: "This workspace is ready for your team's conversations. Start a new chat or share a Sidekiq."
- Consider pre-populating with a welcome thread or onboarding Sidekiq.

### UX Pitfall 4: Two-Tier Sidebar Becomes Three-Tier

**What goes wrong:** The current sidebar has an icon rail + content panels. Adding workspace switching could create: workspace switcher > icon rail > content panels. Three levels of navigation in a sidebar is cognitively overwhelming and physically cramped on smaller screens.

**How to avoid:**
- Integrate the workspace switcher INTO the icon rail (e.g., top of icon rail shows current workspace avatar, clicking opens a switcher dropdown).
- Do NOT add a third sidebar panel level.
- Use a popover/dropdown for workspace switching, not a new panel.
- Look at how Slack, Discord, and Linear handle workspace/team switching: they all use a compact switcher at the top, not a separate panel.

---

## "Looks Done But Isn't" Checklist

These are things that appear complete but have hidden unfinished work:

- [ ] **Workspace middleware exists** -- but has it been applied to ALL workspace-scoped procedures? Check thread, sidekiq, team, and user routers.
- [ ] **workspaceId column added** -- but is it NOT NULL? Is the backfill complete? Are there any rows with NULL workspace_id?
- [ ] **Sidebar shows workspace context** -- but does the thread list filter by workspace? Does creating a new thread assign it to the active workspace?
- [ ] **Chat route updated** -- but does thread creation set `workspaceId`? Does Sidekiq ownership check also verify workspace membership?
- [ ] **Workspace switching works** -- but does it update the tRPC query cache? Or does switching show stale data from the previous workspace?
- [ ] **Feature slices restructured** -- but does the tRPC AppRouter type still infer correctly? Does `tsc --noEmit` pass?
- [ ] **Personal workspace auto-creates** -- but what about existing users who log in after the migration? Is the personal workspace created on-demand if missing?
- [ ] **Team invites migrated** -- but do invite links still work? Does the accept flow create workspace membership?
- [ ] **Tests pass** -- but do they test cross-workspace isolation? Or only single-workspace happy paths?
- [ ] **Drizzle relations updated** -- but do `.with()` queries return correct workspace-scoped data?

---

## Recovery Strategies

### If Vertical Slice Restructuring Breaks Builds

**Symptoms:** TypeScript compilation fails, tRPC types break, imports unresolved.
**Recovery:**
1. Revert to the last working commit.
2. Move ONE file at a time, running `tsc --noEmit` after each move.
3. Use git's `--follow` flag to maintain file history during moves.
4. Update `tsconfig.json` path aliases if needed.

### If Migration Corrupts Data

**Symptoms:** Rows have wrong `workspaceId`, users see others' data, queries return empty results.
**Recovery:**
1. Keep the old `userId` / `ownerId` columns intact (do NOT drop them during migration).
2. If `workspaceId` values are wrong, rebuild from `userId` → personal workspace mapping.
3. Have a rollback migration ready that sets `workspaceId` back to NULL and removes the NOT NULL constraint.
4. Test the migration on a snapshot of production data BEFORE running on production.

### If Workspace Switching UX Is Confusing

**Symptoms:** Users can't find their content, support tickets spike, "where did my threads go?"
**Recovery:**
1. Add a global search that searches across all workspaces.
2. Add a "Recent across all workspaces" section to the sidebar.
3. Show workspace badges on all content (subtle color or icon indicating which workspace owns it).
4. Temporarily allow users to see a flat list of all their content regardless of workspace.

---

## Pitfall-to-Phase Mapping

| Phase | Pitfall | Priority |
|-------|---------|----------|
| **Vertical Slice Restructuring** | Pitfall 3: Breaking tRPC type inference | CRITICAL |
| **Vertical Slice Restructuring** | Pattern 2: Duplicated feature logic | MODERATE |
| **Vertical Slice Restructuring** | Pattern 3: Circular imports | MODERATE |
| **Workspace Schema Design** | Pitfall 4: Personal workspace identity crisis | CRITICAL |
| **Workspace Schema Design** | Pitfall 2: Botched data migration | CRITICAL |
| **Workspace Schema Design** | Trap 2: Missing indexes | HIGH |
| **Workspace Schema Design** | Trap 3: Backfill locks | MODERATE |
| **Workspace Authorization** | Pitfall 1: Missing workspaceId in queries | CRITICAL |
| **Workspace Authorization** | Pitfall 5: Authorization model not updated | CRITICAL |
| **Workspace Authorization** | Mistake 1: Unverified workspace ID | CRITICAL |
| **Workspace Authorization** | Gotcha 2: Chat route not covered | HIGH |
| **Workspace UX** | UX Pitfall 1: Context confusion | HIGH |
| **Workspace UX** | UX Pitfall 2: Draft state lost | MODERATE |
| **Workspace UX** | UX Pitfall 4: Three-tier sidebar | HIGH |
| **Integration** | Gotcha 1: localStorage key migration | MODERATE |
| **Integration** | Gotcha 3: Sidebar complexity | MODERATE |
| **Integration** | Gotcha 4: Drizzle relations stale | HIGH |
| **Post-Migration** | Trap 1: N+1 membership queries | MODERATE |
| **Post-Migration** | Mistake 2: Old routes still active | HIGH |

---

## Sources

### Multi-Tenant Architecture
- [Crunchy Data: Designing Postgres for Multi-Tenancy](https://www.crunchydata.com/blog/designing-your-postgres-database-for-multi-tenancy)
- [Bytebase: Multi-Tenant Database Patterns Explained](https://www.bytebase.com/blog/multi-tenant-database-architecture-patterns-explained/)
- [FlightControl: Ultimate Guide to Multi-Tenant SaaS Data Modeling](https://www.flightcontrol.dev/blog/ultimate-guide-to-multi-tenant-saas-data-modeling)
- [Clerk: How to Design Multi-Tenant SaaS Architecture](https://clerk.com/blog/how-to-design-multitenant-saas-architecture)
- [WorkOS: Developer's Guide to SaaS Multi-Tenant Architecture](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture)

### Drizzle ORM Migrations
- [Drizzle ORM: Migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle ORM: Custom Migrations](https://orm.drizzle.team/docs/kit-custom-migrations)
- [Drizzle Issue #1865: Non-Idempotent ADD COLUMN](https://github.com/drizzle-team/drizzle-orm/issues/1865)
- [Frontend Masters: Drizzle Database Migrations](https://frontendmasters.com/blog/drizzle-database-migrations/)

### PostgreSQL Migration Safety
- [Postgres: Adding Foreign Keys with Zero Downtime](https://travisofthenorth.com/blog/2017/2/2/postgres-adding-foreign-keys-with-zero-downtime)
- [Thomas Skowron: Migrating Foreign Keys in PostgreSQL](https://thomas.skowron.eu/blog/migrating-foreign-keys-in-postgresql/)

### Vertical Slice Architecture
- [Milan Jovanovic: Vertical Slice Architecture](https://www.milanjovanovic.tech/blog/vertical-slice-architecture)
- [Milan Jovanovic: Where Does Shared Logic Live?](https://www.milanjovanovic.tech/blog/vertical-slice-architecture-where-does-the-shared-logic-live)
- [DEV: You're Slicing Your Architecture Wrong](https://dev.to/somedood/youre-slicing-your-architecture-wrong-4ob9)
- [t3-oss Issue #958: Cal.com-Style Router Structure](https://github.com/t3-oss/create-t3-turbo/issues/958)

### tRPC Authorization
- [tRPC: Authorization](https://trpc.io/docs/server/authorization)
- [tRPC: Middlewares](https://trpc.io/docs/server/middlewares)
- [DepthFirst: CVE-2025-59305 AuthN vs AuthZ Case Study](https://depthfirst.com/post/how-an-authorization-flaw-reveals-a-common-security-blind-spot-cve-2025-59305-case-study)

### UX Patterns
- [UX Planet: Best Practices for Sidebar Design](https://uxplanet.org/best-ux-practices-for-designing-a-sidebar-9174ee0ecaa2)
- [LinkedIn: 8 Essential Elements of Sidebar Design](https://www.linkedin.com/pulse/saas-ux-series-8-essential-elements-sidebar-design-srikanth-kalakonda)
