# Stack Research: v0.2 Workspace Model & Multi-Tenant Isolation

**Domain:** Workspace model, multi-tenant isolation, vertical slice architecture, message regeneration for AI chat app
**Researched:** 2026-01-27
**Confidence:** HIGH
**Scope:** NEW capabilities only -- existing stack (Next.js 15, tRPC 11, Drizzle ORM 0.41, Better Auth, Vercel AI SDK 6, Tailwind v4, Radix UI) is validated and NOT re-researched.

---

## Executive Summary

v0.2 requires **zero new npm dependencies**. Every feature (workspace isolation, vertical slice refactor, Sidekiq sharing, message regeneration, expanded model list) can be built entirely with the existing stack. The work is primarily:

1. **Schema evolution** via Drizzle migrations (teams -> workspaces, add `workspaceId` to threads/sidekiqs)
2. **tRPC middleware** for workspace context injection and tenant isolation
3. **File reorganization** to vertical slices (no library changes)
4. **AI SDK `regenerate()`** function already exists in `useChat` hook
5. **Gateway `getAvailableModels()`** API for dynamic model discovery

This is a strong signal: the v0.1 stack was well-chosen. The v0.2 features are architecture and data model problems, not technology gaps.

---

## Recommended Stack Changes

### Summary: No New Dependencies Required

| Feature | Requires New Dependency? | Implementation Approach |
|---------|--------------------------|------------------------|
| Vertical slice architecture | No | File reorganization only |
| Teams -> Workspaces migration | No | Drizzle schema changes + migrations |
| Workspace isolation in tRPC | No | tRPC middleware context extension |
| Sidebar workspace switcher | No | React state + existing Radix UI components |
| Sidekiq sharing within workspaces | No | Schema changes (add `workspaceId` to sidekiqs) |
| Regenerate message button | No | `useChat().regenerate()` already in AI SDK |
| Expanded AI model list | No | `gateway.getAvailableModels()` already in `@ai-sdk/gateway` |

---

## Detailed Technical Patterns

### 1. Drizzle Schema Migrations (Teams -> Workspaces)

**Approach:** Rename `team` table to `workspace` and evolve the data model. Use `drizzle-kit generate` which will prompt for renames vs. drops.

**What changes in schema.ts:**

```
Current tables:         v0.2 tables:
  team            ->      workspace (rename)
  team_member     ->      workspace_member (rename)
  team_invite     ->      workspace_invite (rename)
  team_role enum  ->      workspace_role enum (rename)

New columns:
  workspace.type: 'personal' | 'team' (discriminator)
  workspace.isPersonal: boolean (derived, for queries)
  threads.workspaceId: text (FK to workspace, nullable initially)
  sidekiqs.workspaceId: text (replaces existing teamId FK)
```

**Migration strategy:**

Drizzle Kit supports table/column renames interactively during `drizzle-kit generate`. When prompted "Is workspace table created or renamed from team?" select "renamed." This preserves data.

For adding `workspaceId` to threads (currently user-owned, no workspace):
1. Add column as NULLABLE first (safe, additive DDL)
2. Backfill: set `workspaceId` to user's personal workspace for all existing threads
3. Add NOT NULL constraint after backfill

**Confidence:** HIGH (verified with Drizzle ORM migration docs and community best practices)

**Source:** [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations), [Drizzle Kit Generate](https://orm.drizzle.team/docs/drizzle-kit-generate)

---

### 2. Workspace Isolation via tRPC Middleware

**Approach:** Create a `workspaceProcedure` that extends `protectedProcedure` with workspace context.

**Pattern:** tRPC context extension middleware injects `workspaceId` and `workspaceRole` into the context. All workspace-scoped procedures use this base instead of `protectedProcedure`.

```
Middleware chain:
  publicProcedure
    -> protectedProcedure (adds session.user)
      -> workspaceProcedure (adds workspaceId, workspaceRole, verifies membership)
```

**How workspace is identified:**
- Client sends `workspaceId` as input on every workspace-scoped tRPC call
- Middleware validates user is a member of that workspace
- Context is extended with `workspaceId` and `workspaceRole`

**Why NOT use RLS (Row-Level Security):**
- The app already has application-level isolation via `userId` WHERE clauses in every query
- RLS adds debugging complexity (silent row filtering)
- RLS is overkill for this scale (single-tenant PostgreSQL, <1000 users initially)
- Application-level isolation is easier to test and understand
- RLS is better suited for compliance-heavy enterprise apps or when multiple DB clients access the same database

**Why application-level workspace filtering is sufficient:**
- All data access goes through tRPC (single entry point)
- Middleware enforces membership check before ANY workspace query
- TypeScript type safety ensures `workspaceId` is always present in workspace procedures
- Consistent with existing pattern (v0.1 uses `userId` filtering everywhere)

**Confidence:** HIGH (verified with tRPC middleware docs, PostgreSQL RLS analysis)

**Sources:**
- [tRPC Middlewares](https://trpc.io/docs/server/middlewares)
- [tRPC Context](https://trpc.io/docs/server/context)
- [PostgreSQL RLS Limitations](https://www.bytebase.com/blog/postgres-row-level-security-limitations-and-alternatives/)
- [Drizzle ORM RLS](https://orm.drizzle.team/docs/rls)

---

### 3. Vertical Slice Architecture (File Reorganization)

**Approach:** Move from horizontal layers (`components/`, `hooks/`, `lib/`, `server/`) to feature-driven slices (`features/`). The `app/` directory stays as a thin routing layer.

**No dependencies needed.** This is purely a file reorganization. TypeScript path aliases (`@sidekiq/*`) continue to work. Barrel exports (`index.ts`) provide the public API for each feature.

**Target structure:**

```
src/
  app/                          # Thin routing layer (stays mostly unchanged)
    (auth)/
    (dashboard)/
      chat/
      settings/
      sidekiqs/
    api/
      chat/route.ts             # Streaming endpoint (stays here)
      trpc/[trpc]/route.ts
      auth/[...all]/route.ts

  features/                     # NEW: Vertical slices
    workspace/                  # Workspace management feature
      components/
      hooks/
      server/                   # tRPC router, workspace middleware
      validations/
      types/
      index.ts                  # Public barrel export

    chat/                       # Chat/messaging feature
      components/
      hooks/
      server/                   # Message-related server logic
      validations/
      index.ts

    sidekiq/                    # Custom assistant feature
      components/
      hooks/
      server/                   # tRPC router
      validations/
      index.ts

    auth/                       # Authentication feature
      components/
      server/                   # Better Auth config
      index.ts

    model-picker/               # Model selection feature
      components/
      hooks/
      index.ts

    sidebar/                    # Sidebar navigation feature
      components/
      hooks/
      index.ts

  shared/                       # Cross-cutting concerns
    ui/                         # Radix-based UI primitives (Button, Dialog, etc.)
    lib/                        # Generic utilities (cn, date-grouping, etc.)
    server/                     # DB connection, shared tRPC setup
    styles/
    types/                      # Shared types

  server/                       # Root server config (DB, tRPC init)
    db/
      schema.ts                 # Stays centralized (Drizzle requires single schema file)
      index.ts
    api/
      trpc.ts                   # tRPC init, base procedures
      root.ts                   # Root router (merges feature routers)
```

**Key decisions:**
- `schema.ts` stays centralized because Drizzle Kit requires a single schema entry point in `drizzle.config.ts`. Feature-specific schema fragments can be split into files and re-exported from a central schema, but the drizzle config points to one file.
- `app/api/chat/route.ts` stays in the routing layer because Next.js Route Handlers must be in the `app/api/` directory.
- tRPC routers move into feature directories but are still merged in `server/api/root.ts`.
- Each feature has an `index.ts` barrel file that controls the public API surface.

**Why vertical slices now:**
- At 170 files and growing, horizontal layers are becoming hard to navigate
- v0.2 adds workspace as a cross-cutting concern that touches many features
- Feature isolation makes it easier to reason about workspace scoping per feature
- Testing becomes more focused (test one slice at a time)

**Confidence:** HIGH (well-established pattern, verified with Next.js docs and community guides)

**Sources:**
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Feature-Sliced Design with Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs)
- [Feature Driven Architecture in Next.js](https://medium.com/@JMauclair/feature-driven-architecture-fda-a-scalable-way-to-structure-your-next-js-applications-b8c1703a29c0)

---

### 4. Message Regeneration

**Approach:** Use the built-in `regenerate()` function from `useChat()` hook (Vercel AI SDK 5+, present in AI SDK 6).

**API:**
```typescript
const { regenerate } = useChat({ ... });

// Regenerate last assistant message
regenerate();

// Regenerate specific message
regenerate({ messageId: "msg_123" });
```

**Backend changes needed:** The existing `/api/chat` route handler already supports receiving messages and streaming responses. Regeneration works by:
1. The SDK removes the last assistant message from the UI state
2. Re-sends the conversation (without the removed message) to the server
3. Server streams a new response

**No new endpoint needed.** The existing POST `/api/chat` handles this transparently because `regenerate()` internally re-sends the messages array.

**UI changes needed:**
- Add a "Regenerate" button on the last assistant message (or failed messages)
- Wire it to `regenerate()` from the `useChat` hook
- Handle loading state during regeneration

**Confidence:** HIGH (verified with official AI SDK docs)

**Source:** [AI SDK useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)

---

### 5. Expanded AI Model List

**Approach:** Replace the hardcoded `AVAILABLE_MODELS` array in `models-metadata.ts` with dynamic model discovery from the Vercel AI Gateway.

**Two options:**

**Option A: Dynamic discovery via `gateway.getAvailableModels()` (Recommended)**
- Call `gateway.getAvailableModels()` at build time or with ISR (Incremental Static Regeneration)
- Returns all 85+ models with names, descriptions, pricing, context windows, and tags
- REST endpoint also available: `GET https://ai-gateway.vercel.sh/v1/models`
- No hardcoded model list needed -- always up-to-date
- Requires `@ai-sdk/gateway` version 3.x (already installed as `^3.0.22`)

**Option B: Curated static list (Simpler, more controlled)**
- Expand the current `AVAILABLE_MODELS` array in `models-metadata.ts`
- Hand-pick models from the gateway catalog
- More control over what users see, but requires manual updates

**Recommendation:** Use Option A (dynamic discovery) with a curated filter layer. Fetch all models from the gateway, then apply an allowlist/blocklist to control which models appear in the picker. This gives automatic model updates while maintaining curation.

**No new dependencies.** The `@ai-sdk/gateway` package (already at `^3.0.22`) provides `getAvailableModels()`.

**Confidence:** HIGH (verified with Vercel AI Gateway docs and AI SDK provider docs)

**Sources:**
- [Vercel AI Gateway Models & Providers](https://vercel.com/docs/ai-gateway/models-and-providers)
- [AI SDK Gateway Provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway)
- [Browse AI Gateway Models](https://vercel.com/ai-gateway/models)

---

## What NOT to Add (and Why)

### Do NOT Add: PostgreSQL Row-Level Security (RLS)

**Why not:**
- Adds significant complexity to migrations and debugging
- Application-level isolation via tRPC middleware is sufficient for this scale
- RLS policies make query debugging harder (rows silently filtered)
- Would require switching from simple `postgres` driver to a connection-per-request model with session variables
- Drizzle's `pgPolicy` API exists but is better suited for Supabase/Neon managed environments
- Can be added later as a defense-in-depth layer if compliance requires it

### Do NOT Add: Separate Multi-Tenant Database Library (Nile, etc.)

**Why not:**
- Nile solves a different problem (virtual tenant databases, serverless multi-tenant PostgreSQL)
- The project uses standard PostgreSQL with Drizzle -- adding Nile would mean a database migration
- Application-level tenant isolation with `workspaceId` column filtering is the right pattern for a single-database app
- Schema-based multi-tenancy (one PostgreSQL schema per workspace) is overkill for <100 workspaces

### Do NOT Add: Zustand or Redux for Workspace State

**Why not:**
- Active workspace state can be managed with React Context + localStorage (current pattern with `useActiveTeam`)
- Adding a state management library for one piece of state is over-engineering
- React Query (via tRPC) already handles server state
- The current `useActiveTeam` hook pattern is clean and sufficient -- rename/extend it to `useActiveWorkspace`

### Do NOT Add: Feature-Sliced Design (FSD) Library

**Why not:**
- FSD is a methodology, not a library -- it's just a folder convention
- The project doesn't need an npm package for folder structure
- Adopt the principles (feature isolation, barrel exports, public API boundaries) without the formalism
- FSD's strict layer hierarchy (shared -> entities -> features -> widgets -> pages) is overly rigid for a 170-file app

### Do NOT Add: Custom Migration Framework

**Why not:**
- Drizzle Kit (`drizzle-kit generate` + `drizzle-kit migrate`) handles all migration needs
- It supports interactive rename prompts for table/column renames
- Custom SQL migrations are supported via `drizzle-kit generate --custom`
- The existing migration workflow (`pnpm db:generate` + `pnpm db:migrate`) is established

### Do NOT Add: Redis for Workspace Session Caching

**Why not:**
- Not needed at this scale (single workspace context per user session)
- localStorage + React state handles workspace selection adequately
- PostgreSQL queries with proper indexes are fast enough for workspace lookups
- Defer Redis to a future milestone when performance demands it

---

## Existing Dependencies: Version Compatibility Notes

All existing dependencies are compatible with v0.2 features. No version bumps required.

| Package | Current Version | v0.2 Compatible? | Notes |
|---------|----------------|-------------------|-------|
| `drizzle-orm` | `^0.41.0` | Yes | Supports table renames, new columns, RLS (if needed later) |
| `drizzle-kit` | `^0.30.5` | Yes | Interactive rename prompts, custom migrations |
| `@trpc/server` | `^11.0.0` | Yes | Middleware context extension, pipe() for workspace auth |
| `@ai-sdk/react` | `^3.0.50` | Yes | `useChat().regenerate()` available |
| `@ai-sdk/gateway` | `^3.0.22` | Yes | `gateway.getAvailableModels()` available |
| `ai` | `^6.0.48` | Yes | UIMessage, streamText, all needed features |
| `better-auth` | `^1.3` | Yes | Session management unchanged |
| `@tanstack/react-query` | `^5.69.0` | Yes | Query invalidation on workspace switch |

---

## Database Schema Changes (Preview)

### New Enum

```
workspace_type: 'personal' | 'team'
```

### Renamed Tables

| v0.1 Table | v0.2 Table | Migration |
|------------|------------|-----------|
| `team` | `workspace` | Rename via drizzle-kit |
| `team_member` | `workspace_member` | Rename via drizzle-kit |
| `team_invite` | `workspace_invite` | Rename via drizzle-kit |
| `team_role` enum | `workspace_role` enum | Rename via drizzle-kit |

### New Columns

| Table | Column | Type | Why |
|-------|--------|------|-----|
| `workspace` | `type` | `workspace_type` enum | Distinguish personal vs team workspaces |
| `thread` | `workspaceId` | `text` (FK) | Scope threads to workspaces |
| `sidekiq` | `workspaceId` | `text` (FK) | Replace `teamId`, scope to workspaces |

### Removed Columns

| Table | Column | Why |
|-------|--------|-----|
| `sidekiq` | `teamId` | Replaced by `workspaceId` |
| `sidekiq` | `isPublic` | Replaced by workspace-level sharing |
| `sidekiq` | `canTeamEdit` | Replaced by workspace role permissions |

---

## tRPC Middleware Architecture (Preview)

### Procedure Hierarchy

```
publicProcedure
  -> timingMiddleware

protectedProcedure (existing)
  -> timingMiddleware
  -> authMiddleware (validates session, adds user to ctx)

workspaceProcedure (NEW)
  -> protectedProcedure (inherits auth)
  -> workspaceMiddleware:
      1. Extract workspaceId from input
      2. Query workspace_member for (userId, workspaceId)
      3. If not member -> throw FORBIDDEN
      4. Extend ctx with { workspaceId, workspaceRole, workspace }
```

### Usage Pattern

```
// Feature router uses workspaceProcedure as base:
list: workspaceProcedure
  .input(listThreadsSchema)  // workspaceId already in ctx, not needed in input
  .query(async ({ ctx }) => {
    // ctx.workspaceId is guaranteed present
    // ctx.workspaceRole is 'owner' | 'admin' | 'member'
    return db.query.threads.findMany({
      where: and(
        eq(threads.workspaceId, ctx.workspaceId),
        eq(threads.userId, ctx.session.user.id),
      ),
    });
  }),
```

---

## Installation

No installation needed. Zero new dependencies.

```bash
# Nothing to install for v0.2!
# All features use existing packages.

# Only run migrations after schema changes:
pnpm db:generate
pnpm db:migrate
```

---

## Alternatives Considered

| Decision | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Tenant isolation | Application-level (tRPC middleware) | PostgreSQL RLS | Overkill for scale, harder to debug, adds migration complexity |
| Architecture | Feature slices in `src/features/` | Feature-Sliced Design (FSD) | FSD is too rigid/formal for 170-file app |
| Workspace state | React Context + localStorage | Zustand | Over-engineering for single piece of state |
| Model list | Dynamic via `getAvailableModels()` | Expand hardcoded array | Dynamic stays up-to-date, less maintenance |
| Message regeneration | `useChat().regenerate()` | Custom endpoint | SDK already provides exactly this |
| Schema migration | Drizzle Kit rename | Drop + recreate tables | Rename preserves data, zero downtime |
| Workspace ID in queries | tRPC middleware injection | Pass workspaceId in every input | Middleware is DRY, type-safe, impossible to forget |
| Multi-tenant database | Single DB + column filtering | Nile / schema-per-tenant | Vastly simpler, sufficient for scale |

---

## Stack Patterns by Feature

### Vertical Slice Architecture Refactor
- **Tools:** TypeScript path aliases, barrel exports (`index.ts`)
- **Pattern:** `src/features/{feature}/` with components, hooks, server, validations
- **Key constraint:** `schema.ts` stays centralized (Drizzle Kit requirement)
- **Key constraint:** Route Handlers stay in `app/api/` (Next.js requirement)

### Workspace Data Model
- **Tools:** Drizzle ORM, drizzle-kit generate/migrate
- **Pattern:** Table rename + new columns + multi-step migration (nullable -> backfill -> NOT NULL)
- **Key constraint:** Personal workspace auto-created on user signup (handle in Better Auth hooks or tRPC)

### Workspace Isolation
- **Tools:** tRPC middleware, Drizzle WHERE clauses
- **Pattern:** `workspaceProcedure` extends `protectedProcedure` with workspace context
- **Key constraint:** Every workspace-scoped query MUST filter by `workspaceId`

### Sidekiq Sharing
- **Tools:** Drizzle schema, tRPC router
- **Pattern:** Replace `ownerId`-only filtering with `workspaceId` filtering + role-based edit permissions
- **Key constraint:** Owner still exists but workspace members can access shared Sidekiqs

### Regenerate Message
- **Tools:** AI SDK `useChat().regenerate()`
- **Pattern:** Button on assistant messages calls `regenerate()` or `regenerate({ messageId })`
- **Key constraint:** Backend route handler unchanged; SDK handles re-submission

### Expanded Model List
- **Tools:** `@ai-sdk/gateway` `getAvailableModels()` or REST API
- **Pattern:** Server-side fetch at build/request time, filter/curate, pass to client model picker
- **Key constraint:** Need to handle model metadata (pricing, features) from gateway response format

---

## Sources

### Official Documentation
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle ORM RLS](https://orm.drizzle.team/docs/rls)
- [Drizzle Kit Generate](https://orm.drizzle.team/docs/drizzle-kit-generate)
- [tRPC Middlewares](https://trpc.io/docs/server/middlewares)
- [tRPC Context](https://trpc.io/docs/server/context)
- [AI SDK useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [AI SDK Gateway Provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway)
- [Vercel AI Gateway Models & Providers](https://vercel.com/docs/ai-gateway/models-and-providers)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)

### Architecture Patterns
- [Feature-Sliced Design with Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs)
- [Feature Driven Architecture in Next.js](https://medium.com/@JMauclair/feature-driven-architecture-fda-a-scalable-way-to-structure-your-next-js-applications-b8c1703a29c0)
- [Scalable Next.js Project Architecture](https://blog.logrocket.com/structure-scalable-next-js-project-architecture/)

### Multi-Tenancy Research
- [PostgreSQL RLS Limitations](https://www.bytebase.com/blog/postgres-row-level-security-limitations-and-alternatives/)
- [Row-Level Security for Multi-Tenant Apps](https://www.simplyblock.io/blog/underated-postgres-multi-tenancy-with-row-level-security/)
- [Schema-based Multi-Tenancy with Drizzle ORM](https://medium.com/@vimulatus/schema-based-multi-tenancy-with-drizzle-orm-6562483c9b03)
- [Drizzle ORM Multi-Tenancy Discussion](https://github.com/drizzle-team/drizzle-orm/discussions/1539)
- [tRPC Multi-Tenant Context](https://discord-questions.trpc.io/m/1191810200659837038)

### Migration Best Practices
- [8 Drizzle ORM Patterns for Clean Migrations](https://medium.com/@bhagyarana80/8-drizzle-orm-patterns-for-clean-fast-migrations-456c4c35b9d8)
- [Drizzle ORM Custom Migrations](https://orm.drizzle.team/docs/kit-custom-migrations)

---

*Research completed: 2026-01-27*
*Next step: Use this stack analysis to inform v0.2 roadmap phase structure*
