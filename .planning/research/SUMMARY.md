# Project Research Summary

**Project:** Sidekiq v0.2 Workspaces
**Domain:** Workspace model, multi-tenant isolation, vertical slice architecture for AI chat app
**Researched:** 2026-01-27
**Confidence:** HIGH

## Executive Summary

v0.2 represents a foundational architectural evolution for Sidekiq: migrating from a horizontal layer structure with loose content scoping to a unified workspace model with vertical feature slices. The research reveals a critical insight: **this refactor requires zero new npm dependencies**. Every feature (workspace isolation, vertical slices, Sidekiq sharing, message regeneration, expanded model list) can be implemented entirely with the existing Next.js 15 + tRPC 11 + Drizzle ORM + Vercel AI SDK stack. The work is primarily schema evolution, file reorganization, and authorization pattern changes.

The recommended approach is to treat personal accounts as single-user workspaces rather than maintaining a parallel "personal vs team" system. This unified model—standard across ChatGPT, Claude, Slack, Notion, and Linear—eliminates special-casing, simplifies queries, and provides a natural upgrade path. The existing "team" infrastructure already captures most of what workspaces need: the migration is conceptually a rename (teams → workspaces) plus adding workspace scoping to threads and expanding sharing for Sidekiqs.

The key risk is data isolation failures. Multi-tenant systems fail catastrophically when even one query lacks proper workspace scoping. With 30+ queries across 5 routers and a critical streaming chat route outside the tRPC middleware system, the attack surface is significant. The mitigation is surgical: create a `workspaceProcedure` middleware as the single source of truth for workspace validation, apply it universally to all workspace-scoped operations (including the chat route), and test cross-workspace isolation exhaustively. The vertical slice restructuring must happen first—while behavior is stable—before changing the data model.

## Key Findings

### Recommended Stack

**Summary:** v0.2 requires zero new npm dependencies. This is a strong validation signal that the v0.1 stack was well-chosen. The features are architecture and data model problems, not technology gaps.

**Core patterns to implement:**

- **Drizzle ORM migrations**: Rename `team` → `workspace`, add `workspaceId` to threads/sidekiqs, create personal workspaces for existing users. Use expand-and-contract pattern (nullable → backfill → NOT NULL) to avoid data loss.
- **tRPC middleware**: New `workspaceProcedure` that reads workspace ID from request headers, validates membership, injects verified `workspaceId` into context. This replaces raw `userId` scoping with workspace-level authorization.
- **Vertical slice architecture**: Move from horizontal layers (`components/`, `hooks/`, `server/`) to feature-driven slices (`features/workspace/`, `features/chat/`, `features/sidekiq/`). The `app/` directory stays thin (routing only). Schema stays centralized (Drizzle requirement).
- **AI SDK regeneration**: `useChat().regenerate()` already exists in AI SDK. No custom endpoint needed—button calls the function, SDK handles re-submission.
- **Gateway model discovery**: `@ai-sdk/gateway` package (already at `^3.0.22`) provides `getAvailableModels()` for dynamic model list expansion. No hardcoded array needed.

**Critical constraint:** The `/api/chat` route handler is NOT a tRPC procedure, so it must independently perform workspace validation. This is the highest-risk integration point.

### Expected Features

**Summary:** Workspace features follow a clear dependency order: foundation → isolation → switching → sharing. Message regeneration and expanded model list are independent and can run in parallel.

**Must have (table stakes):**

- Personal workspace auto-created on signup (every user needs a workspace from day one)
- Workspace switcher in sidebar (universal SaaS pattern: top-left, always visible)
- Full content isolation per workspace (threads and sidekiqs scoped by `workspaceId`)
- Instant context switch (no page reload, just data refetch)
- Sidekiq sharing within workspace (core collaboration value)
- Regenerate message button (table stakes for AI chat since 2023)

**Should have (differentiators):**

- Workspace-scoped Sidekiq library in sidebar (unlike ChatGPT where GPTs are buried)
- Seamless team-to-workspace migration (existing users get zero-downtime upgrade)
- Expanded model list (150+ models via AI Gateway reinforces "model agnostic" positioning)

**Defer (v0.3+):**

- Cross-workspace Sidekiq sharing (breaks isolation model, Slack-scale re-architecture)
- Workspace-level billing (premature, no payment system exists yet)
- Workspace admin panel (large UX surface, reuse team settings for v0.2)
- Nested workspaces (extreme complexity for no v0.2 benefit)

### Architecture Approach

**Summary:** Workspace isolation propagates via HTTP headers: client-side React Context sets `X-Workspace-Id` on every request, server-side tRPC middleware validates membership and injects workspace context. All queries filter by `workspaceId`. Personal workspaces are real database entities (not null states), eliminating special-case logic.

**Major components:**

1. **WorkspaceProvider (Client)**: React Context managing active workspace state, persisting to localStorage, injecting `X-Workspace-Id` header on all tRPC and fetch requests. Auto-selects personal workspace if no valid workspace is stored.
2. **workspaceProcedure (Server)**: tRPC middleware that reads workspace ID from headers, queries workspace membership, validates user is a member, injects `ctx.workspaceId` and `ctx.workspaceRole` for all downstream procedures.
3. **Vertical Feature Slices**: `src/features/` directory containing self-contained modules (workspace, chat, sidekiq, auth, model-picker, sidebar). Each owns components, hooks, server logic, validations, and types. The `app/` directory becomes thin routing wrappers.
4. **Database Migration**: Multi-step migration: (1) create workspaces and members tables, (2) add nullable `workspaceId` columns, (3) backfill personal workspaces and assign existing content, (4) add NOT NULL constraint, (5) add indexes. Custom SQL required (cannot rely on `drizzle-kit generate` alone).
5. **Route Handler Integration**: `/api/chat/route.ts` must independently read `X-Workspace-Id`, validate membership (shared helper function), and scope all thread/message operations to the verified workspace.

**Data flow:** User switches workspace → React state updates → localStorage persists → all TanStack Query caches invalidate → next tRPC request includes new header → middleware validates → queries refetch with new workspace scope → UI updates.

### Critical Pitfalls

1. **Forgetting `workspaceId` in even one query (data leak)**: With 30+ queries across 5 routers plus 8+ operations in the chat route, missing even one workspace filter causes cross-tenant data leaks. **Prevention:** Create `workspaceProcedure` first, use it universally, add lint rule to verify workspace filtering on all queries, write cross-workspace isolation tests.

2. **Botched data migration (NOT NULL on existing rows)**: Adding `workspaceId NOT NULL` fails on tables with existing data. Developer makes column nullable forever (losing guarantee) or causes production downtime. **Prevention:** Use expand-and-contract pattern: add nullable column, backfill personal workspaces, assign content, then add NOT NULL. Write custom migration SQL, test on production snapshot.

3. **Breaking tRPC type inference during vertical slice move**: Moving router files from `server/api/routers/` to `features/*/server/router.ts` breaks TypeScript path resolution. The `AppRouter` type no longer infers correctly, frontend queries break. **Prevention:** Move one router at a time, verify types compile after each move, add CI type-check, do NOT use barrel files for routers.

4. **Personal workspace identity crisis**: Personal workspace behaves inconsistently with team workspaces (different UI, different permissions, null state handling everywhere). **Prevention:** Make personal workspace a real database entity with `type: 'personal'` column. Auto-create on signup, auto-select on login, restrict operations by type (not by null checks).

5. **Authorization model not updated for workspace ownership**: Queries add `workspaceId` filtering but keep old `userId` ownership checks, breaking shared workspace content. Or worse: trust client-provided `workspaceId` without server verification. **Prevention:** `workspaceProcedure` validates membership before injecting context. Replace `userId` filtering with `workspaceId` filtering. Never trust client workspace ID.

## Implications for Roadmap

Based on research, the migration has two independent dimensions: structural (vertical slices) and data model (workspace). These must be phased separately to reduce risk.

### Phase 1: Vertical Slice Restructuring

**Rationale:** Get folder structure right first while behavior is stable. This is a low-risk, high-volume change (170+ files) that does not alter any runtime behavior. Every test should pass identically before and after.

**Delivers:**
- `src/features/` directory with self-contained modules (auth, chat, sidekiq, workspace, sidebar, model-picker)
- `src/shared/` for cross-cutting utilities (replaces `lib/`)
- Thin `app/` page files that import from features
- Updated `root.ts` importing routers from feature directories
- Barrel exports (`index.ts`) defining each feature's public API

**Addresses:**
- Architecture pattern from ARCHITECTURE.md (vertical slices in Next.js App Router)
- Foundation for workspace features (workspace becomes its own feature slice)

**Avoids:**
- Pitfall 3 (breaking tRPC type inference) by moving incrementally and verifying types after each move
- Pattern 2 (duplicated feature logic) by creating `shared/` for genuinely cross-cutting code
- Pattern 3 (circular imports) by keeping schema centralized and using shared types

**Research flag:** Standard patterns (Next.js + FSD guides). No additional research needed.

### Phase 2: Workspace Schema Migration

**Rationale:** Schema must change before server logic can use workspace scoping. This is the highest-risk change—data must be migrated without loss, backfilled correctly, and validated exhaustively.

**Delivers:**
- `workspace` and `workspace_member` tables (renamed from team tables)
- `workspace_type` enum (`personal` | `team`)
- Personal workspace auto-created for all existing users
- `workspaceId` column added to threads and sidekiqs (NOT NULL with backfill)
- Indexes on workspace-scoped queries
- Drizzle relations updated for new schema

**Addresses:**
- Foundation for all workspace features from FEATURES.md
- Database patterns from ARCHITECTURE.md (personal workspace as real entity)
- Stack approach from STACK.md (expand-and-contract migration)

**Avoids:**
- Pitfall 2 (botched migration) by using multi-step nullable → backfill → NOT NULL pattern
- Pitfall 4 (personal workspace crisis) by creating real workspace entities with type column
- Trap 2 (missing indexes) by adding indexes in migration
- Trap 3 (backfill locks) by batching updates if needed

**Research flag:** Needs validation during planning. Migration SQL is complex (7+ steps), requires testing on production data snapshot.

### Phase 3: Workspace Authorization & Context

**Rationale:** With schema in place, implement the authorization middleware and update all queries. This touches every router and the critical chat route. Must be comprehensive—missing one query causes data leaks.

**Delivers:**
- `workspaceProcedure` tRPC middleware with membership validation
- All thread queries scoped by `workspaceId` (replace `userId` filtering)
- All sidekiq queries scoped by `workspaceId` (replace `ownerId` filtering)
- `/api/chat/route.ts` updated with workspace validation and scoping
- Personal workspace creation in auth signup flow
- Shared `validateWorkspaceMembership()` helper for Route Handler

**Addresses:**
- Core workspace isolation from FEATURES.md
- Authorization patterns from ARCHITECTURE.md (header-based propagation)
- Security model from STACK.md (application-level isolation)

**Avoids:**
- Pitfall 1 (data leak) by creating middleware first, applying universally, testing isolation
- Pitfall 5 (authorization not updated) by replacing ownership checks with membership checks
- Gotcha 2 (chat route forgotten) by explicitly including it in scope
- Mistake 1 (unverified workspace ID) by validating membership in middleware

**Research flag:** Needs review during planning. Authorization changes are security-critical. Every query must be audited.

### Phase 4: Client-Side Workspace Context & Switching

**Rationale:** Server is ready, now wire up the client. This enables the workspace switching UX and connects frontend state to backend scoping.

**Delivers:**
- WorkspaceProvider React Context with localStorage persistence
- tRPC client configured to inject `X-Workspace-Id` header
- Workspace switcher component in sidebar icon rail
- `useWorkspace` hook (replaces `useActiveTeam`)
- Query invalidation on workspace switch
- Workspace-aware navigation (redirect to /chat on switch if needed)

**Addresses:**
- Workspace switcher from FEATURES.md (table stakes)
- Client-side patterns from ARCHITECTURE.md (header injection, React Context)

**Avoids:**
- UX Pitfall 1 (context confusion) by showing clear workspace indicator
- UX Pitfall 4 (three-tier sidebar) by integrating switcher into icon rail
- Gotcha 1 (localStorage migration) by handling old `activeTeamId` fallback
- Trap 1 (N+1 queries) by caching membership in context

**Research flag:** Standard patterns (React Context, tRPC headers). No additional research needed.

### Phase 5: Feature Integration & Polish

**Rationale:** Core workspace model works. Now update all features to use workspace scoping and add feature-level enhancements (Sidekiq sharing, regeneration, model list).

**Delivers:**
- Sidekiq sharing within workspace (permission model: can use / can edit)
- Sidebar panels filtered by active workspace
- Settings pages updated (Teams → Workspaces)
- Personal workspace UI constraints (hide invite, member limit = 1)
- Message regeneration button (calls `useChat().regenerate()`)
- Expanded model list (150+ models via AI Gateway)
- Empty states for new workspaces

**Addresses:**
- Sidekiq sharing from FEATURES.md (core collaboration)
- Regenerate message from FEATURES.md (table stakes)
- Expanded model list from FEATURES.md (differentiator)
- UI patterns from PITFALLS.md (empty states, workspace indicators)

**Avoids:**
- UX Pitfall 2 (draft state lost) by persisting drafts per workspace
- UX Pitfall 3 (empty state overload) by showing encouraging messages
- Gotcha 3 (sidebar explosion) by refactoring incrementally
- Gotcha 4 (stale Drizzle relations) by updating relations alongside schema

**Research flag:** Feature-level details may need validation (Sidekiq permission UX, model picker integration).

### Phase Ordering Rationale

1. **Vertical slices first (Phase 1)** because it's a pure file move with zero behavior changes. Establishes structure before touching data model. Reduces cognitive load during later phases.

2. **Schema migration next (Phase 2)** because authorization and client features depend on the workspace schema existing. Cannot add workspace scoping to queries until `workspaceId` column exists.

3. **Authorization before client (Phase 3 → 4)** because the server must enforce isolation before the client can switch workspaces. Building client features first would create a false sense of completion without actual data protection.

4. **Feature integration last (Phase 5)** because it depends on all prior phases. Sidekiq sharing needs workspace context. Regeneration needs workspace-scoped threads. Model picker needs stable workspace state.

5. **Independent features (regeneration, model list) can run in parallel** during Phase 5 because they have no workspace dependencies. Regeneration is purely client-side (`useChat` hook). Model list is configuration-only.

### Research Flags

**Phases needing deeper research during planning:**

- **Phase 2 (Schema Migration):** Custom SQL migration with backfill is complex. Needs validation with production data snapshot. Edge cases: users with no threads, deleted teams, orphaned sidekiqs.
- **Phase 3 (Authorization):** Every query must be audited for workspace filtering. Consider automated testing or lint rules. Chat route integration is non-standard (not tRPC).
- **Phase 5 (Feature Integration):** Sidekiq permission model UX needs design validation. Which actions require "can edit" vs "can use"? How to display permission state in UI?

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Vertical Slices):** Well-documented Next.js + FSD pattern. Mechanical file moves.
- **Phase 4 (Client Context):** Standard React Context + tRPC header injection pattern. Many examples in tRPC docs and Discord.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All features implementable with existing dependencies. Patterns verified against official docs (Drizzle, tRPC, AI SDK). No version bumps needed. |
| Features | HIGH | Verified against ChatGPT, Claude, Slack, Notion, Linear workspace implementations. Table stakes vs differentiators clearly defined. Dependency tree validated. |
| Architecture | HIGH | Patterns adapted from real-world Next.js + tRPC apps. Header-based workspace propagation is standard multi-tenant pattern. Personal workspace as real entity is industry consensus. |
| Pitfalls | HIGH | Based on direct codebase analysis (30+ queries identified, 170+ files counted). Multi-tenant failure modes well-documented in sources. Migration risks validated against Drizzle community issues. |

**Overall confidence:** HIGH

### Gaps to Address

**Migration edge cases:** The backfill logic for assigning existing content to workspaces assumes all users have threads/sidekiqs. Edge cases need handling: users with no content, deleted teams with orphaned sidekiqs, invalid foreign keys. Solution: Test migration on production snapshot, handle null cases in backfill SQL.

**Chat route workspace validation:** The `/api/chat/route.ts` performs 8+ database operations outside tRPC. Each needs workspace scoping. Gap: Need to audit every DB call in the route and extract shared validation logic. Solution: Create `validateWorkspaceContext()` helper used by both tRPC middleware and chat route.

**Performance at scale:** Research assumes <1000 users, <100 workspaces. If scale is higher, the N+1 workspace membership queries and backfill table locks become real issues. Solution: Profile during Phase 3, add caching/batching if needed.

**Vertical slice boundaries:** Some components are genuinely shared (date grouping, avatar rendering, model selection) but their boundaries are fuzzy. Solution: Use the "3+ slices need it → shared" rule. Can refactor later if boundaries clarify.

**localStorage migration:** Users with old `sidekiq-active-team-id` key need seamless upgrade. Gap: Need to map old team IDs to new workspace IDs. Solution: Migration code reads old key, looks up corresponding workspace, updates to new key. Fallback to personal workspace if mapping fails.

## Sources

### Primary (HIGH confidence)

**Stack Research:**
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations) — schema evolution, rename detection
- [tRPC Middlewares](https://trpc.io/docs/server/middlewares) — context extension, authorization patterns
- [AI SDK useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) — regenerate() function
- [Vercel AI Gateway Models](https://vercel.com/docs/ai-gateway/models-and-providers) — getAvailableModels() API
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) — App Router routing

**Features Research:**
- [ChatGPT Enterprise Workspace Management](https://help.openai.com/en/articles/8265430-what-is-a-chatgpt-enterprise-workspace-how-can-i-switch-workspaces) — workspace switching, content isolation
- [Claude Project Visibility](https://support.claude.com/en/articles/9519189-project-visibility-and-sharing) — permission models
- [Slack Unified Grid Architecture](https://slack.engineering/unified-grid-how-we-re-architected-slack-for-our-largest-customers/) — cross-workspace lessons

**Architecture Research:**
- [Feature-Sliced Design with Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs) — App Router integration
- [AWS PostgreSQL Data Access Patterns for SaaS](https://aws.amazon.com/blogs/database/choose-the-right-postgresql-data-access-pattern-for-your-saas-application/) — pool model multi-tenancy
- [tRPC Multi-Tenant Context](https://discord-questions.trpc.io/m/1191810200659837038) — workspace slug in context

**Pitfalls Research:**
- [FlightControl Multi-Tenant SaaS Data Modeling](https://www.flightcontrol.dev/blog/ultimate-guide-to-multi-tenant-saas-data-modeling) — common isolation failures
- [Drizzle ORM Custom Migrations](https://orm.drizzle.team/docs/kit-custom-migrations) — expand-and-contract pattern
- [Postgres Adding Foreign Keys with Zero Downtime](https://travisofthenorth.com/blog/2017/2/2/postgres-adding-foreign-keys-with-zero-downtime) — NOT VALID constraint pattern

### Secondary (MEDIUM confidence)

- [WorkOS Multi-Tenant Architecture Guide](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture) — architectural patterns
- [Feature Driven Architecture in Next.js](https://medium.com/@JMauclair/feature-driven-architecture-fda-a-scalable-way-to-structure-your-next-js-applications-b8c1703a29c0) — vertical slice examples
- [Milan Jovanovic: Where Does Shared Logic Live?](https://www.milanjovanovic.tech/blog/vertical-slice-architecture-where-does-the-shared-logic-live) — feature boundaries

### Tertiary (LOW confidence, needs validation)

- [Drizzle Issue #3826: Rename + Other Changes](https://github.com/drizzle-team/drizzle-orm/issues/3826) — potential migration edge case
- [UX Planet: Sidebar Design Best Practices](https://uxplanet.org/best-ux-practices-for-designing-a-sidebar-9174ee0ecaa2) — workspace switcher placement

---

*Research completed: 2026-01-27*

*Ready for roadmap: yes*
