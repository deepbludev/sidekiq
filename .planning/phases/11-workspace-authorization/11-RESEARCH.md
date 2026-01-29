# Phase 11: Workspace Authorization - Research

**Researched:** 2026-01-29
**Domain:** tRPC middleware, workspace isolation, authorization patterns
**Confidence:** HIGH

## Summary

This research audits the entire Sidekiq codebase to identify every data access path that needs workspace scoping, then documents the patterns for implementing `workspaceProcedure` middleware, a shared `validateWorkspaceMembership()` helper, header-based workspace context passing, and chat route integration.

The codebase has 5 tRPC routers with a total of 23 procedures. Of these, 7 procedures in the `thread` and `sidekiq` routers need workspace scoping. The workspace router has 14 procedures that already perform their own membership checks. The user and health routers (2 procedures total) are user-global and need no workspace scoping. The `/api/chat` route handler has 8+ distinct DB operations, all of which need workspace-aware filtering.

**Primary recommendation:** Create a `workspaceProcedure` that extends `protectedProcedure` with a middleware reading `x-workspace-id` from request headers, validating membership via a shared `validateWorkspaceMembership()` function, and injecting `workspaceId` into the tRPC context. The chat route reuses the same validation function independently. Client-side, inject the header in both the tRPC client (`httpBatchStreamLink.headers`) and the chat transport (`DefaultChatTransport` headers/fetch).

## Standard Stack

No new libraries are needed. This phase is pure middleware/authorization logic built on existing dependencies.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @trpc/server | ^11.0.0 | tRPC middleware, context extension | Already in use, v11 middleware API supports chained `.use()` with context narrowing |
| @trpc/client | ^11.0.0 | `httpBatchStreamLink` headers injection | Already configured in `react.tsx` |
| drizzle-orm | (existing) | DB queries with `eq()`, `and()` for workspace filtering | Already in use throughout routers |
| zod | (existing) | Input validation for workspaceId | Already used for all input schemas |
| ai / @ai-sdk/react | ^6.0.48 / ^3.0.50 | `DefaultChatTransport` headers for chat route | Already used in chat-interface.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | (existing) | ID generation for auto-created personal workspaces | Self-healing personal workspace creation |

**Installation:** None required -- all dependencies already present.

## Architecture Patterns

### Recommended File Structure
```
src/
├── shared/
│   ├── trpc/
│   │   └── trpc.ts                    # ADD workspaceProcedure here (extends protectedProcedure)
│   └── lib/
│       └── workspace-auth.ts          # NEW: validateWorkspaceMembership() shared helper
├── features/
│   ├── chats/
│   │   └── api/
│   │       └── router.ts             # MODIFY: switch protectedProcedure -> workspaceProcedure
│   ├── sidekiqs/
│   │   └── api/
│   │       └── router.ts             # MODIFY: switch protectedProcedure -> workspaceProcedure
│   └── workspace/
│       └── hooks/
│           └── use-active-workspace.ts # EXISTING: source of activeWorkspaceId for header injection
└── app/
    └── api/
        └── chat/
            └── route.ts               # MODIFY: add workspace validation using shared helper
```

### Pattern 1: workspaceProcedure Middleware (tRPC Context Extension)

**What:** A new procedure builder that extends `protectedProcedure` with workspace membership validation. Reads `x-workspace-id` from request headers, validates membership, and injects `workspaceId` into context.

**When to use:** All procedures that access workspace-scoped data (threads, sidekiqs).

**Implementation pattern:**
```typescript
// In src/shared/trpc/trpc.ts
import { validateWorkspaceMembership } from "@sidekiq/shared/lib/workspace-auth";

export const workspaceProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const workspaceId = ctx.headers.get("x-workspace-id");

  if (!workspaceId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Missing workspace context",
    });
  }

  const membership = await validateWorkspaceMembership(
    ctx.db,
    workspaceId,
    ctx.session.user.id,
  );

  if (!membership) {
    // Log unauthorized access attempt for security auditing
    console.warn(
      `[Auth] Unauthorized workspace access: userId=${ctx.session.user.id}, workspaceId=${workspaceId}, timestamp=${new Date().toISOString()}`,
    );
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }

  return next({
    ctx: {
      workspaceId,
      workspaceRole: membership.role,
    },
  });
});
```

**Confidence:** HIGH -- This pattern is directly supported by tRPC v11's `t.procedure.use()` API. The existing `protectedProcedure` already demonstrates this exact pattern (narrowing `session` to non-nullable). Context extension with `next({ ctx: {...} })` is the standard tRPC approach.

### Pattern 2: Shared validateWorkspaceMembership() Helper

**What:** A pure async function that checks workspace membership and returns role or null. Used by both tRPC middleware and chat route handler.

**When to use:** Any server-side code path that needs to verify workspace access.

**Implementation pattern:**
```typescript
// In src/shared/lib/workspace-auth.ts
import { and, eq } from "drizzle-orm";
import { workspaceMembers, workspaces } from "@sidekiq/shared/db/schema";
import type { db as DbType } from "@sidekiq/shared/db";
import type { WorkspaceRole } from "@sidekiq/workspace/lib/permissions";

interface WorkspaceMembership {
  role: WorkspaceRole;
  workspaceType: "personal" | "team";
}

/**
 * Validate that a user is a member of a workspace.
 * Returns membership details or null if not a member.
 *
 * Used by both tRPC workspaceProcedure middleware and /api/chat route handler.
 *
 * @param db - Database instance
 * @param workspaceId - Workspace ID to validate
 * @param userId - User ID to check membership for
 * @returns Membership details (role, type) or null if not a member
 */
export async function validateWorkspaceMembership(
  db: typeof DbType,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMembership | null> {
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId),
    ),
    columns: { role: true },
    with: {
      workspace: {
        columns: { type: true },
      },
    },
  });

  if (!membership) return null;

  return {
    role: membership.role,
    workspaceType: membership.workspace.type,
  };
}
```

**Confidence:** HIGH -- The `getUserWorkspaceRole()` function already exists in the workspace router (`src/features/workspace/api/router.ts`, line 57-70). This is essentially extracting + extending that pattern into a shared utility.

### Pattern 3: Client-Side Header Injection

**What:** Inject `x-workspace-id` header in both the tRPC client and the chat transport.

**When to use:** All client-to-server communication that requires workspace context.

**Implementation pattern for tRPC client:**
```typescript
// In src/shared/trpc/react.tsx - modify httpBatchStreamLink headers
httpBatchStreamLink({
  transformer: SuperJSON,
  url: getBaseUrl() + "/api/trpc",
  headers: () => {
    const headers = new Headers();
    headers.set("x-trpc-source", "nextjs-react");
    // Inject active workspace ID from localStorage
    const workspaceId = localStorage.getItem("sidekiq-active-workspace-id");
    if (workspaceId) {
      headers.set("x-workspace-id", workspaceId);
    }
    return headers;
  },
}),
```

**Implementation pattern for chat transport:**
```typescript
// In src/features/chats/components/chat-interface.tsx - modify DefaultChatTransport
const transport = useMemo(
  () =>
    new DefaultChatTransport({
      api: "/api/chat",
      headers: () => {
        const headers: Record<string, string> = {};
        const workspaceId = localStorage.getItem("sidekiq-active-workspace-id");
        if (workspaceId) {
          headers["x-workspace-id"] = workspaceId;
        }
        return headers;
      },
      body: () => { /* existing body logic */ },
      fetch: customFetch,
    }),
  [sidekiq, customFetch],
);
```

**Implementation pattern for RSC server-side tRPC:**
```typescript
// In src/shared/trpc/server.ts - headers are forwarded from Next.js request
// The x-workspace-id header from the browser is already available via headers()
// No changes needed -- the RSC caller already passes through request headers
```

**Confidence:** HIGH -- The tRPC client already demonstrates header injection with `x-trpc-source`. The localStorage key `sidekiq-active-workspace-id` is already defined and used in `use-active-workspace.ts` (line 6). The AI SDK `DefaultChatTransport` accepts a `headers` option (verified from chat-interface.tsx usage).

### Pattern 4: Personal Workspace Fallback with Self-Healing

**What:** When `x-workspace-id` header is missing (or workspace is missing from DB), fall back to the user's personal workspace. If personal workspace doesn't exist (race condition during signup), auto-create it.

**Implementation pattern:**
```typescript
// Used inside validateWorkspaceMembership or a wrapper
export async function resolveWorkspaceId(
  db: typeof DbType,
  headerWorkspaceId: string | null,
  userId: string,
): Promise<{ workspaceId: string; role: WorkspaceRole }> {
  // If header provided, validate it
  if (headerWorkspaceId) {
    const membership = await validateWorkspaceMembership(db, headerWorkspaceId, userId);
    if (membership) {
      return { workspaceId: headerWorkspaceId, role: membership.role };
    }
    // Header workspace invalid -- fall through to personal
  }

  // Fall back to personal workspace
  let personalWorkspace = await db.query.workspaces.findFirst({
    where: and(
      eq(workspaces.ownerId, userId),
      eq(workspaces.type, "personal"),
    ),
    columns: { id: true },
  });

  // Self-healing: auto-create personal workspace if missing
  if (!personalWorkspace) {
    const workspaceId = nanoid();
    const [created] = await db.insert(workspaces).values({
      id: workspaceId,
      name: "Personal",
      type: "personal",
      ownerId: userId,
      memberLimit: 1,
      avatar: { type: "initials" as const, color: "#6366f1" },
    }).returning({ id: workspaces.id });

    await db.insert(workspaceMembers).values({
      workspaceId,
      userId,
      role: "owner",
    });

    personalWorkspace = created!;
  }

  return { workspaceId: personalWorkspace.id, role: "owner" };
}
```

**Confidence:** HIGH -- The self-healing pattern mirrors the existing `databaseHooks.user.create.after` in `auth/api/config.ts` (lines 72-96). The personal workspace lookup pattern is already used in the chat route (lines 156-169).

### Anti-Patterns to Avoid

- **Scoping workspace.list by workspaceId:** The `workspace.list` procedure lists all workspaces a user belongs to. This is intentionally unscoped -- it returns ALL workspace memberships for the user, NOT filtered by active workspace. Do NOT apply `workspaceProcedure` to it.

- **Requiring workspaceId for user-global data:** The `user.getPreferences` and `user.updateModelPreferences` procedures are user-scoped, not workspace-scoped. Do NOT force a workspaceId on these.

- **Double-filtering by userId AND workspaceId in thread queries:** Currently, thread queries filter by `threads.userId`. After adding workspace scoping, replace `eq(threads.userId, ctx.session.user.id)` with `eq(threads.workspaceId, ctx.workspaceId)` for list queries. For mutations that modify a specific thread, also verify the thread belongs to the workspace (not just the user) to prevent cross-workspace access.

- **Checking membership on every message in a stream:** Validating workspace membership on every message during an active stream is expensive and unnecessary. Validate on the initial POST request. Do NOT add middleware to the streaming response.

## Comprehensive Audit: All Data Access Paths

### tRPC Routers (5 routers, 23 procedures total)

#### 1. thread router (`src/features/chats/api/router.ts`) -- 7 procedures

| Procedure | Type | Current Auth | Needs Workspace Scoping | Action Required |
|-----------|------|-------------|------------------------|-----------------|
| `getTitle` | query | `protectedProcedure` + userId filter | YES | Switch to `workspaceProcedure`, add `eq(threads.workspaceId, ctx.workspaceId)` |
| `list` | query | `protectedProcedure` + userId filter | YES | Switch to `workspaceProcedure`, filter by `workspaceId` instead of userId |
| `delete` | mutation | `protectedProcedure` + userId in WHERE | YES | Switch to `workspaceProcedure`, add `workspaceId` to WHERE clause |
| `archive` | mutation | `protectedProcedure` + userId in WHERE | YES | Switch to `workspaceProcedure`, add `workspaceId` to WHERE clause |
| `unarchive` | mutation | `protectedProcedure` + userId in WHERE | YES | Switch to `workspaceProcedure`, add `workspaceId` to WHERE clause |
| `togglePin` | mutation | `protectedProcedure` + userId in WHERE | YES | Switch to `workspaceProcedure`, add `workspaceId` to WHERE clause |
| `rename` | mutation | `protectedProcedure` + userId in WHERE | YES | Switch to `workspaceProcedure`, add `workspaceId` to WHERE clause |

**Key change:** `thread.list` currently uses `eq(threads.userId, ctx.session.user.id)`. After scoping, change to `eq(threads.workspaceId, ctx.workspaceId)`. This means a team workspace will return ALL threads from ALL members, not just the requesting user's threads. This is the correct behavior for team workspaces (shared visibility). For mutations, BOTH `workspaceId` and `userId` checks should remain to prevent one team member from modifying another's thread (future role-based editing is a separate concern).

#### 2. sidekiq router (`src/features/sidekiqs/api/router.ts`) -- 7 procedures

| Procedure | Type | Current Auth | Needs Workspace Scoping | Action Required |
|-----------|------|-------------|------------------------|-----------------|
| `list` | query | `protectedProcedure` + ownerId filter | YES | Switch to `workspaceProcedure`, filter by `workspaceId` |
| `getById` | query | `protectedProcedure` + ownerId filter | YES | Switch to `workspaceProcedure`, verify sidekiq belongs to workspace |
| `create` | mutation | `protectedProcedure` + ownerId set | YES | Switch to `workspaceProcedure`, set `workspaceId` on new sidekiq |
| `update` | mutation | `protectedProcedure` + ownerId in WHERE | YES | Switch to `workspaceProcedure`, add `workspaceId` to WHERE |
| `delete` | mutation | `protectedProcedure` + ownerId in WHERE | YES | Switch to `workspaceProcedure`, add `workspaceId` to WHERE |
| `toggleFavorite` | mutation | `protectedProcedure` + ownerId in WHERE | YES | Switch to `workspaceProcedure`, add `workspaceId` to WHERE |
| `duplicate` | mutation | `protectedProcedure` + ownerId in WHERE | YES | Switch to `workspaceProcedure`, set `workspaceId` on duplicate |

**Key change:** `sidekiq.list` currently filters by `eq(sidekiqs.ownerId, ctx.session.user.id)`. After scoping, filter by `eq(sidekiqs.workspaceId, ctx.workspaceId)`. For team workspaces, this means all workspace members can see all workspace sidekiqs. Name uniqueness should also be scoped to workspace, not user. The `ownerId` still represents who created it (for audit/display), but access is now workspace-based.

#### 3. workspace router (`src/features/workspace/api/router.ts`) -- 14 procedures

| Procedure | Type | Current Auth | Needs Workspace Scoping | Action Required |
|-----------|------|-------------|------------------------|-----------------|
| `list` | query | `protectedProcedure` + userId join | NO | Intentionally unscoped (lists ALL user workspaces) |
| `getById` | query | `protectedProcedure` + membership check | NO | Already checks membership internally |
| `create` | mutation | `protectedProcedure` | NO | Creates a new workspace (no workspace context needed) |
| `update` | mutation | `protectedProcedure` + role check | NO | Already validates membership/role internally |
| `delete` | mutation | `protectedProcedure` + role check | NO | Already validates membership/role internally |
| `listMembers` | query | `protectedProcedure` + membership check | NO | Already checks membership internally |
| `listInvites` | query | `protectedProcedure` + role check | NO | Already validates membership/role internally |
| `invite` | mutation | `protectedProcedure` + role check | NO | Already validates membership/role internally |
| `acceptInvite` | mutation | `protectedProcedure` + email check | NO | Uses invite token, not workspace context |
| `getInviteByToken` | query | `publicProcedure` | NO | Public endpoint, no auth needed |
| `revokeInvite` | mutation | `protectedProcedure` + role check | NO | Already validates membership/role internally |
| `resendInvite` | mutation | `protectedProcedure` + role check | NO | Already validates membership/role internally |
| `removeMember` | mutation | `protectedProcedure` + role check | NO | Already validates membership/role internally |
| `changeRole` | mutation | `protectedProcedure` + role check | NO | Already validates membership/role internally |
| `transferOwnership` | mutation | `protectedProcedure` + role check | NO | Already validates membership/role internally |
| `leave` | mutation | `protectedProcedure` + membership check | NO | Already validates membership internally |

**Rationale:** The workspace router already performs its own membership/role checks in each procedure via `getUserWorkspaceRole()`. These take the workspace ID from the input (not from a header), and that is correct -- workspace management operates on a specific workspace passed as an argument, not the "active" workspace from the sidebar.

#### 4. user router (`src/features/user/api/router.ts`) -- 2 procedures

| Procedure | Type | Current Auth | Needs Workspace Scoping | Action Required |
|-----------|------|-------------|------------------------|-----------------|
| `getPreferences` | query | `protectedProcedure` + userId | NO | User-global, not workspace-scoped |
| `updateModelPreferences` | mutation | `protectedProcedure` + userId | NO | User-global, not workspace-scoped |

#### 5. health router (`src/shared/trpc/routers/health.ts`) -- 1 procedure

| Procedure | Type | Current Auth | Needs Workspace Scoping | Action Required |
|-----------|------|-------------|------------------------|-----------------|
| `check` | query | `publicProcedure` | NO | System health, no auth at all |

### Chat Route Handler (`src/app/api/chat/route.ts`) -- 8+ DB Operations

| Operation | Line | Current Auth | Workspace Impact | Action Required |
|-----------|------|-------------|------------------|-----------------|
| Sidekiq ownership check | 96-113 | ownerId check | Replace with workspace membership check | Verify sidekiq belongs to active workspace |
| Existing thread verification | 123-149 | userId check | Add workspaceId match check | Verify `thread.workspaceId === requestWorkspaceId` |
| Auto-unarchive | 142-147 | Implicit via thread lookup | Already scoped | No change (within verified thread context) |
| Personal workspace lookup | 156-168 | ownerId + type check | Replace with active workspace | Use workspace from header, not hardcoded personal |
| New thread creation | 171-182 | userId set | Already sets workspaceId | Use workspace from header instead of personal lookup |
| Sidekiq stats update | 194-202 | sidekiqId match | Already scoped | No change (within verified sidekiq context) |
| User message insert | 216-222 | threadId set | Already scoped | No change (within verified thread context) |
| Sidekiq instructions lookup | 234-239 | sidekiqId match | Verify workspace match | Verify sidekiq is in same workspace |
| Assistant message insert | 282-296 | threadId set | Already scoped | No change (within verified thread context) |
| Thread lastActivityAt update | 299-306 | threadId match | Already scoped | No change (within verified thread context) |
| Title generation & update | 314-319 | threadId match | Already scoped | No change (within verified thread context) |

**Key changes needed in chat route:**
1. Read `x-workspace-id` from request headers
2. Validate workspace membership using shared `validateWorkspaceMembership()`
3. For new threads: use the header workspaceId instead of always using personal workspace
4. For existing threads: verify `thread.workspaceId === headerWorkspaceId`
5. For sidekiq ownership: verify sidekiq belongs to the active workspace (not just owned by user)

### SSR Server Components -- 2 Pages with Direct DB Access

| Page | File | Current Auth | Action Required |
|------|------|-------------|-----------------|
| Thread page | `src/app/(dashboard)/chat/[threadId]/page.tsx` | userId filter on threads query | Add workspaceId verification (thread's workspace must match) |
| New chat page | `src/app/(dashboard)/chat/page.tsx` | ownerId filter on sidekiqs query | Add workspace membership verification for sidekiq access |

**Important:** These server components make direct DB queries (not via tRPC). They need independent workspace validation. However, they can't easily access the `x-workspace-id` header since they're SSR pages. Options:
1. Use cookies (set by client when workspace changes) -- more persistent than headers
2. Read from the browser request headers (Next.js `headers()` includes custom headers from client-side navigation)
3. Accept that SSR pages may need to infer workspace from the thread/sidekiq being accessed

**Recommendation for Phase 11:** For the thread page, the workspace is implicitly known from the thread record. Verify the user is a member of that thread's workspace. For the new chat page with a sidekiq query param, verify the user is a member of the sidekiq's workspace. This avoids needing the header in SSR pages (the data being accessed implies the workspace).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Workspace membership validation | Custom SQL in each procedure | Shared `validateWorkspaceMembership()` function | CONTEXT.md explicitly requires a shared helper; also prevents inconsistencies |
| tRPC middleware chaining | Duplicate auth + workspace check in each procedure | `workspaceProcedure = protectedProcedure.use(workspaceMiddleware)` | tRPC v11 natively supports `.use()` chaining with context extension |
| Workspace ID transport | Custom query params or body fields | `x-workspace-id` request header | Headers are the standard HTTP mechanism; already used for `x-trpc-source` |
| Self-healing personal workspace | Separate endpoint or cron job | Inline auto-creation in `resolveWorkspaceId()` | CONTEXT.md decision: auto-create on the fly during auth check |

**Key insight:** The `getUserWorkspaceRole()` function already exists in `workspace/api/router.ts` (lines 57-70). The shared helper is essentially an extraction and slight extension of this existing function. Do not write a new implementation from scratch -- refactor the existing one.

## Common Pitfalls

### Pitfall 1: Forgetting SSR Direct DB Queries

**What goes wrong:** The `chat/[threadId]/page.tsx` server component makes direct DB queries with `db.query.threads.findFirst()` -- this bypasses tRPC middleware entirely.
**Why it happens:** Developers focus on tRPC routers and forget that RSC pages can also access the database directly.
**How to avoid:** Explicitly audit all `db.query` and `db.select` calls outside of tRPC routers. Add workspace validation to both the `ThreadPage` and `NewChatPage` server components.
**Warning signs:** If you can access a thread via its URL even after being removed from its workspace, this check is missing.

### Pitfall 2: thread.list Scoping Semantics Change

**What goes wrong:** Currently `thread.list` returns only the authenticated user's threads. After workspace scoping, `thread.list` in a team workspace should return ALL threads in that workspace (from all members), not just the requesting user's threads.
**Why it happens:** Changing from `eq(threads.userId, ctx.session.user.id)` to `eq(threads.workspaceId, ctx.workspaceId)` implicitly changes the query semantics.
**How to avoid:** This is intentional for team workspaces (shared visibility). For personal workspaces, the result is the same (personal workspace has only one member). Document this semantic change clearly. The sidebar thread list component will automatically show the right threads because it queries `thread.list` without additional client-side filtering.
**Warning signs:** If team workspace members can't see each other's threads, the filter hasn't been updated.

### Pitfall 3: Sidekiq Name Uniqueness Scope Change

**What goes wrong:** Sidekiq name uniqueness is currently per-user (`eq(sidekiqs.ownerId, ctx.session.user.id)`). With workspace scoping, it should be per-workspace. If left per-user, two team members could create sidekiqs with the same name in the same workspace.
**Why it happens:** The uniqueness check was written before workspaces existed.
**How to avoid:** Change the uniqueness check in `sidekiq.create` and `sidekiq.update` to use `eq(sidekiqs.workspaceId, ctx.workspaceId)` combined with the case-insensitive name check.
**Warning signs:** If two sidekiqs with the same name appear in a team workspace sidebar.

### Pitfall 4: Chat Route Missing Header for New Thread Creation

**What goes wrong:** The chat route currently hardcodes personal workspace lookup for new threads (lines 156-168). If the header injection isn't working, new threads always go to personal workspace.
**Why it happens:** The chat route uses `fetch()` not tRPC, so it doesn't benefit from tRPC middleware.
**How to avoid:** Read `x-workspace-id` from `req.headers` at the top of the POST handler, validate it, and use it for new thread creation. Add a fallback to personal workspace only if the header is missing.
**Warning signs:** New threads always appearing in "Personal" even when a team workspace is active.

### Pitfall 5: tRPC Client Headers Are Set Once at Init

**What goes wrong:** The `headers` function in `httpBatchStreamLink` is called per-request, but reading from `localStorage` in a `useState` initializer means the tRPC client is created once. If the function reads directly from localStorage each time (as recommended), this is fine. But if someone caches the workspace ID in state, it won't update when the user switches workspaces.
**Why it happens:** The tRPC client is created in a `useState(() => ...)` initializer that runs once.
**How to avoid:** The `headers` option in `httpBatchStreamLink` is a function that is called per-request. Read directly from `localStorage.getItem()` inside this function, not from a React state variable. This is correct because localStorage is synchronous and always returns the latest value.
**Warning signs:** After switching workspaces in the dropdown, tRPC queries still return data from the old workspace.

### Pitfall 6: Race Condition Between Workspace Switch and In-Flight Requests

**What goes wrong:** User switches workspace while a tRPC request is in-flight. The response returns data from the old workspace, but the UI expects data from the new workspace.
**Why it happens:** The header is read at request time, but the response arrives after the workspace changes.
**How to avoid:** Invalidate all tRPC queries when workspace changes. TanStack Query's `invalidateQueries()` will cancel stale requests and refetch with the new workspace header. The `useActiveWorkspace` hook's `setActiveWorkspaceId` should trigger this invalidation.
**Warning signs:** Stale data from a previous workspace showing briefly after switching.

## Code Examples

### Example 1: workspaceProcedure Definition

```typescript
// src/shared/trpc/trpc.ts (additions)
import { validateWorkspaceMembership } from "@sidekiq/shared/lib/workspace-auth";

/**
 * Workspace-scoped procedure.
 * Extends protectedProcedure with workspace membership validation.
 * Reads x-workspace-id from request headers, validates membership,
 * and injects workspaceId + workspaceRole into context.
 *
 * Falls back to personal workspace if header is missing.
 */
export const workspaceProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const workspaceId = ctx.headers.get("x-workspace-id");

  if (!workspaceId) {
    // Fall back to personal workspace
    const personalWs = await ctx.db.query.workspaces.findFirst({
      where: and(
        eq(workspaces.ownerId, ctx.session.user.id),
        eq(workspaces.type, "personal"),
      ),
      columns: { id: true },
    });

    if (!personalWs) {
      // Self-healing: this should never happen if databaseHooks work correctly
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Personal workspace not found",
      });
    }

    return next({
      ctx: {
        workspaceId: personalWs.id,
        workspaceRole: "owner" as const,
      },
    });
  }

  const membership = await validateWorkspaceMembership(ctx.db, workspaceId, ctx.session.user.id);

  if (!membership) {
    console.warn(
      `[Auth] Unauthorized workspace access: userId=${ctx.session.user.id}, workspaceId=${workspaceId}, timestamp=${new Date().toISOString()}`,
    );
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }

  return next({
    ctx: {
      workspaceId,
      workspaceRole: membership.role,
    },
  });
});
```

### Example 2: Migrating thread.list to workspaceProcedure

```typescript
// src/features/chats/api/router.ts (modified)
list: workspaceProcedure
  .input(listThreadsInputSchema)
  .query(async ({ ctx, input }) => {
    const includeArchived = input?.includeArchived ?? false;

    const result = await ctx.db.query.threads.findMany({
      where: includeArchived
        ? eq(threads.workspaceId, ctx.workspaceId)  // Changed from userId to workspaceId
        : and(
            eq(threads.workspaceId, ctx.workspaceId),  // Changed
            eq(threads.isArchived, false),
          ),
      orderBy: [desc(threads.isPinned), desc(threads.lastActivityAt)],
      // ... rest unchanged
    });

    return result;
  }),
```

### Example 3: Chat Route Workspace Validation

```typescript
// src/app/api/chat/route.ts (additions at top of POST handler)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Workspace validation
  const headerWorkspaceId = req.headers.get("x-workspace-id");
  let workspaceId: string;

  if (headerWorkspaceId) {
    const membership = await validateWorkspaceMembership(
      db,
      headerWorkspaceId,
      session.user.id,
    );
    if (!membership) {
      console.warn(
        `[Auth] Unauthorized workspace access in chat: userId=${session.user.id}, workspaceId=${headerWorkspaceId}`,
      );
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
    workspaceId = headerWorkspaceId;
  } else {
    // Fallback to personal workspace
    const personalWs = await db.query.workspaces.findFirst({
      where: and(
        eq(workspaces.ownerId, session.user.id),
        eq(workspaces.type, "personal"),
      ),
      columns: { id: true },
    });
    if (!personalWs) {
      return new Response(
        JSON.stringify({ error: "Personal workspace not found" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    workspaceId = personalWs.id;
  }

  // Then use workspaceId throughout:
  // - For existing threads: verify thread.workspaceId === workspaceId
  // - For new threads: use workspaceId instead of personal workspace lookup
  // - For sidekiq access: verify sidekiq.workspaceId === workspaceId
  // ...
}
```

### Example 4: Client-Side Header Injection in tRPC

```typescript
// src/shared/trpc/react.tsx (modified headers function)
httpBatchStreamLink({
  transformer: SuperJSON,
  url: getBaseUrl() + "/api/trpc",
  headers: () => {
    const headers = new Headers();
    headers.set("x-trpc-source", "nextjs-react");
    // Read workspace ID directly from localStorage on every request
    if (typeof window !== "undefined") {
      const workspaceId = localStorage.getItem("sidekiq-active-workspace-id");
      if (workspaceId) {
        headers.set("x-workspace-id", workspaceId);
      }
    }
    return headers;
  },
}),
```

### Example 5: Query Invalidation on Workspace Switch

```typescript
// In use-active-workspace.ts or a wrapper hook
const utils = api.useUtils();

const setActiveWorkspaceId = useCallback((workspaceId: string | null) => {
  if (workspaceId) {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
  } else {
    localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
  }
  setActiveWorkspaceIdState(workspaceId);

  // Invalidate all workspace-scoped queries so they refetch with new header
  void utils.thread.list.invalidate();
  void utils.sidekiq.list.invalidate();
  // Note: workspace.list is NOT invalidated (it's unscoped)
}, [utils]);
```

## Discretion Decisions (Recommendations)

Based on codebase analysis and security best practices, here are my recommendations for the Claude's Discretion items from CONTEXT.md:

### 1. Error Response Format: Generic 403
**Recommendation:** Use generic "Access denied" for all workspace authorization failures. Do not reveal whether the workspace exists, what type it is, or why access was denied. This follows OWASP security best practices -- authorization errors should not leak information.

### 2. Role-Based Checks: Defer to Later Phases
**Recommendation:** Phase 11 should only check membership (is-member-yes-or-no). Role-based checks (can-edit, can-delete based on owner/admin/member) are a separate concern for Phase 12/13. The `workspaceRole` is available in context for future use but not enforced in this phase.

### 3. Workspace Context Transport: x-workspace-id Header
**Recommendation:** Use `x-workspace-id` HTTP header. This is the cleanest approach because: (a) headers are already used for `x-trpc-source`, (b) both tRPC and fetch support custom headers, (c) no URL changes needed, (d) no session state modification needed, (e) same header name and parsing for both tRPC and chat route.

### 4. Middleware Granularity: Only Workspace-Scoped Procedures
**Recommendation:** Create `workspaceProcedure` as a separate procedure builder. Only apply it to procedures that need workspace scoping (thread and sidekiq routers). Keep `protectedProcedure` for workspace management, user preferences, etc. This avoids unnecessary DB lookups on every request.

### 5. Missing Workspace ID: Fall Back to Personal Workspace
**Recommendation:** If `x-workspace-id` header is missing, fall back to personal workspace. This provides graceful degradation -- the app works even if the header injection hasn't loaded yet (initial page load, SSR). The alternative (returning an error) would break the initial render and require complex client-side initialization logic.

### 6. Shared Header Name and Parsing: Yes
**Recommendation:** Both tRPC and `/api/chat` should use `x-workspace-id` header with identical parsing (`req.headers.get("x-workspace-id")`). The shared `validateWorkspaceMembership()` function ensures consistent validation logic.

### 7. Personal Workspace Middleware: Same Middleware, No Bypass
**Recommendation:** Personal workspace goes through the same `validateWorkspaceMembership()` path. The personal workspace has a `workspace_member` row (created in databaseHooks), so membership validation works identically. Bypassing would create a code path that could have different security properties.

### 8. Chat Route Validation Frequency: On Initial POST Only
**Recommendation:** Validate workspace membership once at the beginning of the POST handler. Do not validate on every message or during streaming. The stream is a single HTTP response -- once the response starts, workspace validation for that request is complete.

### 9. Stream Interruption on Membership Revocation: No
**Recommendation:** Do not interrupt active streams. Membership revocation takes effect on the next request. Interrupting a stream mid-generation is technically complex (requires polling during generation) and provides minimal security benefit for a human-scale operation (membership revocation happens in minutes, not milliseconds).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `eq(threads.userId, ctx.session.user.id)` for list queries | `eq(threads.workspaceId, ctx.workspaceId)` | Phase 11 | Team workspace members see all workspace threads |
| `eq(sidekiqs.ownerId, ctx.session.user.id)` for list queries | `eq(sidekiqs.workspaceId, ctx.workspaceId)` | Phase 11 | Team workspace members see all workspace sidekiqs |
| Hardcoded personal workspace in chat route | Dynamic workspace from header | Phase 11 | New threads created in active workspace |
| No workspace context in tRPC | `workspaceProcedure` with `x-workspace-id` header | Phase 11 | All workspace-scoped data isolated |

**Deprecated after this phase:**
- Direct `ownerId` filtering for sidekiq access (replaced by workspace membership)
- `userId` filtering for thread list queries (replaced by workspace scoping)
- Personal workspace hardcoded lookup in chat route (replaced by header-based workspace)

## Open Questions

1. **Thread ownership in team workspaces**
   - What we know: Thread list will show all workspace threads. Thread mutations (delete, archive, pin, rename) currently check `userId`.
   - What's unclear: Should team members be able to delete/archive each other's threads? Or only their own?
   - Recommendation: For Phase 11, keep `userId` check on mutations (only thread creator can modify). Role-based editing (admin can modify any thread) deferred to future phase.

2. **Sidekiq uniqueness constraint in database**
   - What we know: There's a unique index on `(ownerId, LOWER(name))` (schema line 254). If we switch to workspace-based access, two users could theoretically own the same-named sidekiq in a workspace.
   - What's unclear: Should the DB unique index change to `(workspaceId, LOWER(name))`?
   - Recommendation: Add `workspaceId` to the name uniqueness validation in the router code. The DB index migration is a separate concern and may need to be coordinated with the workspace-id-nullable constraint. For Phase 11, enforce uniqueness in application code only.

3. **SSR page workspace context**
   - What we know: `chat/[threadId]/page.tsx` and `chat/page.tsx` make direct DB queries. They use `getSession()` but don't have access to client-side headers easily.
   - What's unclear: Whether Next.js `headers()` includes custom client headers during client-side navigation (it does for fetch requests but not for initial SSR).
   - Recommendation: For SSR pages, infer workspace from the data being accessed (thread's workspace, sidekiq's workspace) rather than from a header. Validate that the user is a member of that inferred workspace.

## Sources

### Primary (HIGH confidence)
- **Codebase audit** -- All files read directly from `/Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp/src/`
  - `shared/trpc/trpc.ts` -- tRPC initialization, protectedProcedure
  - `shared/trpc/root.ts` -- All 5 routers registered
  - `shared/trpc/react.tsx` -- Client-side tRPC provider with httpBatchStreamLink
  - `shared/trpc/server.ts` -- RSC tRPC caller
  - `shared/db/schema.ts` -- Full schema (workspaces, workspaceMembers, threads, sidekiqs, messages)
  - `features/chats/api/router.ts` -- 7 thread procedures
  - `features/sidekiqs/api/router.ts` -- 7 sidekiq procedures
  - `features/workspace/api/router.ts` -- 14 workspace procedures
  - `features/user/api/router.ts` -- 2 user procedures
  - `shared/trpc/routers/health.ts` -- 1 health procedure
  - `app/api/chat/route.ts` -- Chat route handler (342 lines)
  - `app/(dashboard)/chat/[threadId]/page.tsx` -- Thread SSR page
  - `app/(dashboard)/chat/page.tsx` -- New chat SSR page
  - `features/chats/components/chat-interface.tsx` -- useChat + DefaultChatTransport
  - `features/workspace/hooks/use-active-workspace.ts` -- Active workspace state + localStorage
  - `features/workspace/lib/permissions.ts` -- Role-based permission helpers
  - `features/auth/api/config.ts` -- Better Auth config + databaseHooks
  - `features/chats/validations.ts` -- Chat request schema

### Secondary (MEDIUM confidence)
- [tRPC v11 Middleware Documentation](https://trpc.io/docs/server/middlewares) -- WebFetched, confirms `.use()` chaining and context extension patterns

### Tertiary (LOW confidence)
- None -- all findings verified against codebase and official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries, all existing dependencies
- Architecture (tRPC middleware): HIGH -- Pattern confirmed in both codebase (`protectedProcedure`) and tRPC v11 docs
- Architecture (header injection): HIGH -- `httpBatchStreamLink.headers` already used for `x-trpc-source`
- Audit completeness: HIGH -- Every router, every procedure, every DB operation in chat route audited
- Pitfalls: HIGH -- Derived from direct code analysis of edge cases

**Research date:** 2026-01-29
**Valid until:** No expiration -- codebase-specific research, valid as long as code hasn't changed
