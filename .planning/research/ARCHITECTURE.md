# Architecture Research: Workspace Model & Vertical Slice Refactor

**Domain:** Workspace model and vertical slice architecture for AI chat app
**Researched:** 2026-01-27
**Confidence:** HIGH (based on direct codebase analysis + verified patterns)

## Executive Summary

This document addresses how to integrate a unified workspace model and vertical feature slice architecture into the existing Sidekiq codebase -- a Next.js 15 App Router application with tRPC 11, Drizzle ORM, and Better Auth. The existing codebase has 170 TypeScript files organized in horizontal layers (components/, hooks/, server/, lib/) and a team model that lacks content isolation. The refactor involves two intertwined concerns: (1) reorganizing code into vertical feature slices, and (2) migrating the team model to a unified workspace model where all content is workspace-scoped.

**Key architectural decisions:**
- **Vertical slices go in `src/features/`** -- the `src/app/` directory stays thin (routing only), while each feature owns its components, hooks, validations, types, and server logic.
- **Workspace model is a rename + extend of teams** -- not a parallel system. The `team` table becomes `workspace` with a `type` column (`personal` | `team`).
- **Workspace context propagation via tRPC middleware** -- a `workspaceProcedure` that reads `workspaceId` from request headers (set by client) and injects it into tRPC context. This is the single source of truth for workspace scoping.
- **Personal workspace auto-created on signup** -- every user gets a personal workspace, eliminating the null/personal ambiguity.

## System Overview (After v0.2)

```
+------------------------------------------------------------------+
|                        Client Layer                                |
|  +--------------------------------------------------------------+ |
|  | WorkspaceProvider (React Context)                             | |
|  |  - activeWorkspaceId (from localStorage, validated)           | |
|  |  - setActiveWorkspace()                                       | |
|  |  - Sets X-Workspace-Id header on all tRPC + fetch requests   | |
|  +--------------------------------------------------------------+ |
|         |                           |                              |
|    POST /api/chat              tRPC queries                        |
|    (X-Workspace-Id header)     (X-Workspace-Id header)             |
+---------+-----------------------+----------------------------------+
          |                       |
+---------v-----------------------v----------------------------------+
|                        Server Layer                                |
|                                                                    |
|  +--------------------------+  +-------------------------------+   |
|  | Route Handler            |  | tRPC Router                   |   |
|  | /api/chat/route.ts       |  |                               |   |
|  |                          |  | workspaceProcedure:            |   |
|  | - Reads X-Workspace-Id   |  |   - Reads X-Workspace-Id      |   |
|  | - Validates membership   |  |   - Validates membership      |   |
|  | - Scopes thread creation |  |   - ctx.workspaceId injected  |   |
|  | - streamText()           |  |   - All queries scoped        |   |
|  +-----------+--------------+  +---------------+---------------+   |
|              |                                 |                   |
|  +-----------v---------------------------------v---------------+   |
|  |  Drizzle ORM + PostgreSQL                                   |   |
|  |  workspace, workspace_member, thread, sidekiq, message      |   |
|  |  ALL content tables have workspace_id FK                    |   |
|  +-------------------------------------------------------------+   |
+--------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **WorkspaceProvider** | Client-side workspace state, header injection | localStorage, tRPC client, fetch |
| **WorkspaceSwitcher** | UI for switching workspaces in sidebar icon rail | WorkspaceProvider |
| **workspaceProcedure** | tRPC middleware: validates workspace membership, injects workspaceId | tRPC context, DB |
| **Route Handler** | Reads X-Workspace-Id header, validates, scopes AI operations | DB, LLM Provider |
| **Feature Slices** | Self-contained feature modules (chat, sidekiq, workspace, auth) | tRPC, components, hooks |
| **Database** | Workspace-scoped content storage | All server code |

## Recommended Project Structure (Vertical Slices)

### Target Directory Layout

```
sidekiq-webapp/src/
+-- app/                              # THIN routing only
|   +-- (auth)/
|   |   +-- sign-in/page.tsx          # Imports from features/auth
|   |   +-- sign-up/page.tsx
|   |   +-- forgot-password/page.tsx
|   |   +-- reset-password/page.tsx
|   |   +-- layout.tsx
|   +-- (dashboard)/
|   |   +-- chat/
|   |   |   +-- page.tsx              # Imports from features/chat
|   |   |   +-- [threadId]/page.tsx
|   |   |   +-- layout.tsx
|   |   +-- sidekiqs/
|   |   |   +-- page.tsx              # Imports from features/sidekiq
|   |   |   +-- new/page.tsx
|   |   |   +-- [id]/edit/page.tsx
|   |   |   +-- layout.tsx
|   |   +-- settings/
|   |   |   +-- page.tsx              # Imports from features/settings
|   |   |   +-- workspaces/page.tsx   # Renamed from teams/
|   |   |   +-- layout.tsx
|   |   +-- layout.tsx                # Dashboard layout with WorkspaceProvider
|   +-- api/
|   |   +-- auth/[...all]/route.ts
|   |   +-- chat/route.ts             # Imports from features/chat
|   |   +-- trpc/[trpc]/route.ts
|   +-- invite/[token]/page.tsx
|   +-- layout.tsx
|   +-- page.tsx
|
+-- features/                         # VERTICAL SLICES (new)
|   +-- auth/
|   |   +-- components/
|   |   |   +-- auth-card.tsx
|   |   |   +-- sign-in-form.tsx
|   |   |   +-- sign-up-form.tsx
|   |   |   +-- forgot-password-form.tsx
|   |   |   +-- reset-password-form.tsx
|   |   |   +-- oauth-buttons.tsx
|   |   +-- validations.ts
|   |   +-- types.ts
|   |   +-- index.ts                  # Public API barrel
|   |
|   +-- chat/
|   |   +-- components/
|   |   |   +-- chat-interface.tsx
|   |   |   +-- chat-header.tsx
|   |   |   +-- chat-input.tsx
|   |   |   +-- message-list.tsx
|   |   |   +-- message-item.tsx
|   |   |   +-- message-content.tsx
|   |   |   +-- message-actions.tsx
|   |   |   +-- empty-state.tsx
|   |   |   +-- typing-indicator.tsx
|   |   |   +-- scroll-to-bottom.tsx
|   |   |   +-- chat-scroll-anchor.tsx
|   |   |   +-- model-switch-hint.tsx
|   |   +-- hooks/
|   |   |   +-- use-auto-scroll.ts
|   |   |   +-- use-scroll-position.ts
|   |   +-- server/
|   |   |   +-- router.ts             # threadRouter (tRPC)
|   |   |   +-- chat-handler.ts       # Route handler logic (extracted from route.ts)
|   |   +-- validations.ts
|   |   +-- types.ts
|   |   +-- index.ts
|   |
|   +-- sidekiq/
|   |   +-- components/
|   |   |   +-- sidekiq-form.tsx
|   |   |   +-- sidekiq-card.tsx
|   |   |   +-- sidekiq-list.tsx
|   |   |   +-- sidekiq-picker.tsx
|   |   |   +-- sidekiq-preview.tsx
|   |   |   +-- sidekiq-avatar.tsx
|   |   |   +-- sidekiq-indicator.tsx
|   |   |   +-- sidekiq-empty-state.tsx
|   |   |   +-- avatar-picker.tsx
|   |   |   +-- color-picker.tsx
|   |   |   +-- emoji-picker-popover.tsx
|   |   |   +-- instructions-editor.tsx
|   |   |   +-- conversation-starters.tsx
|   |   |   +-- starter-templates.tsx
|   |   |   +-- delete-sidekiq-dialog.tsx
|   |   +-- hooks/
|   |   |   +-- use-sidekiq-actions.ts
|   |   +-- server/
|   |   |   +-- router.ts             # sidekiqRouter (tRPC)
|   |   +-- validations.ts
|   |   +-- types.ts
|   |   +-- index.ts
|   |
|   +-- workspace/                    # NEW FEATURE (replaces team)
|   |   +-- components/
|   |   |   +-- workspace-switcher.tsx     # Replaces team selector in sidebar
|   |   |   +-- workspace-create-dialog.tsx
|   |   |   +-- workspace-settings.tsx
|   |   |   +-- workspace-avatar.tsx       # Reused from team-avatar
|   |   |   +-- invite-member-dialog.tsx
|   |   |   +-- invite-accept-card.tsx
|   |   |   +-- remove-member-dialog.tsx
|   |   |   +-- delete-workspace-dialog.tsx
|   |   +-- hooks/
|   |   |   +-- use-active-workspace.ts    # Replaces use-active-team
|   |   |   +-- use-member-search.tsx
|   |   +-- server/
|   |   |   +-- router.ts                 # workspaceRouter (tRPC)
|   |   |   +-- permissions.ts            # Replaces team-permissions
|   |   +-- providers/
|   |   |   +-- workspace-provider.tsx     # React Context + header injection
|   |   +-- validations.ts
|   |   +-- types.ts
|   |   +-- index.ts
|   |
|   +-- model-picker/
|   |   +-- components/
|   |   |   +-- model-picker.tsx
|   |   |   +-- model-picker-trigger.tsx
|   |   |   +-- model-picker-content.tsx
|   |   |   +-- model-item.tsx
|   |   |   +-- model-hover-card.tsx
|   |   +-- hooks/
|   |   |   +-- use-model-selection.ts
|   |   +-- index.ts
|   |
|   +-- sidebar/
|   |   +-- components/
|   |   |   +-- sidebar-layout.tsx
|   |   |   +-- sidebar-icon-rail.tsx
|   |   |   +-- sidebar-panel.tsx
|   |   |   +-- sidebar-panel-chats.tsx
|   |   |   +-- sidebar-panel-sidekiqs.tsx
|   |   |   +-- sidebar-panel-workspaces.tsx  # Replaces sidebar-panel-teams
|   |   |   +-- sidebar-search.tsx
|   |   |   +-- sidebar-thread-list.tsx
|   |   |   +-- sidebar-thread-group.tsx
|   |   |   +-- sidebar-mobile-overlay.tsx
|   |   |   +-- sidebar-mobile-tabs.tsx
|   |   +-- hooks/
|   |   |   +-- use-keyboard-shortcuts.ts
|   |   |   +-- use-view-preference.ts
|   |   |   +-- use-thread-actions.ts
|   |   |   +-- use-thread-search.tsx
|   |   +-- utils.ts                       # sidebar-utils (getActiveFeature)
|   |   +-- index.ts
|   |
|   +-- settings/
|   |   +-- components/                    # Settings-specific components
|   |   +-- index.ts
|
+-- server/                           # SHARED server infrastructure
|   +-- api/
|   |   +-- trpc.ts                   # Context, procedures (public, protected, workspace)
|   |   +-- root.ts                   # Combines all feature routers
|   +-- db/
|   |   +-- index.ts                  # Drizzle instance
|   |   +-- schema.ts                 # ALL table definitions (single source of truth)
|   +-- better-auth/
|       +-- index.ts
|       +-- config.ts
|       +-- server.ts
|       +-- client.ts
|
+-- shared/                           # SHARED utilities (replaces lib/)
|   +-- components/                   # Provider icons, shared UI
|   |   +-- icons/
|   |       +-- provider-icons.tsx
|   +-- utils/
|   |   +-- utils.ts                  # cn() etc.
|   |   +-- date-grouping.ts
|   +-- types/                        # Shared type definitions
|   +-- constants/                    # App-wide constants
|
+-- components/ui/                    # Radix UI primitives (stays here)
|   +-- button.tsx
|   +-- input.tsx
|   +-- dialog.tsx
|   +-- ... (all shadcn/ui components)
|
+-- trpc/                             # tRPC client setup (stays here)
|   +-- react.tsx
|   +-- server.ts
|   +-- query-client.ts
|
+-- styles/
|   +-- globals.css
+-- middleware.ts
+-- env.js
```

### Key Structural Decisions

**1. `src/features/` contains vertical slices, NOT `src/app/`.**

The `app/` directory follows Next.js routing conventions and stays thin. Each page file is a minimal wrapper that imports from the corresponding feature. This avoids the conflict between Next.js's file-based routing and vertical slice organization (a known friction point documented in Feature-Sliced Design guides).

```typescript
// src/app/(dashboard)/chat/page.tsx -- THIN, just routing
import { ChatPageContent } from "@sidekiq/features/chat";

export default function ChatPage() {
  return <ChatPageContent />;
}
```

**2. Each feature has a `server/router.ts` that exports its tRPC router.**

The root router (`src/server/api/root.ts`) imports from each feature's server directory. This keeps related server logic colocated with the feature it serves.

```typescript
// src/server/api/root.ts
import { workspaceRouter } from "@sidekiq/features/workspace/server/router";
import { threadRouter } from "@sidekiq/features/chat/server/router";
import { sidekiqRouter } from "@sidekiq/features/sidekiq/server/router";
// ...
```

**3. Database schema stays in `src/server/db/schema.ts` (single file).**

Despite vertical slicing, the schema stays centralized because Drizzle ORM needs all tables and relations in scope for query builder inference. Splitting the schema across features would break relation types.

**4. `src/lib/` becomes `src/shared/`** for clarity. The `src/lib/ai/` directory contents move into `src/features/chat/` since AI model logic is chat-specific.

**5. Path aliases update:**

```json
{
  "paths": {
    "@sidekiq/*": ["./src/*"],
    "@sidekiq/features/*": ["./src/features/*"],
    "@sidekiq/shared/*": ["./src/shared/*"]
  }
}
```

The existing `@sidekiq/*` alias still works as a catch-all, so features can be imported as `@sidekiq/features/chat` or `@sidekiq/features/workspace/providers/workspace-provider`.

## Architectural Patterns

### Pattern 1: Workspace Context Propagation

**The core pattern:** Active workspace ID flows from client-side React Context through HTTP headers to server-side tRPC context.

```
                          CLIENT                               SERVER
+---------------------------+      +------------------------------------------+
| WorkspaceProvider         |      | createTRPCContext()                       |
|  - state: workspaceId     |      |  - reads X-Workspace-Id header           |
|  - localStorage persist   |      |  - passes to tRPC context                |
|  - validates on load      |      |                                          |
+----------+----------------+      +----------+-------------------------------+
           |                                  |
           | Sets header on                   | Available in ctx
           | every request                    |
           v                                  v
+---------------------------+      +------------------------------------------+
| tRPC httpBatchStreamLink  |      | workspaceProcedure middleware             |
|  headers: () => ({        |      |  - Validates workspaceId is not null      |
|    "X-Workspace-Id": id   |      |  - Verifies user is member of workspace  |
|  })                       |      |  - Injects ctx.workspaceId               |
+---------------------------+      |  - Injects ctx.workspaceRole             |
                                   +------------------------------------------+
                                              |
+---------------------------+                 v
| Route Handler             |      +------------------------------------------+
| /api/chat/route.ts        |      | Feature procedures                       |
|  - Reads X-Workspace-Id   |      |  thread.list:                            |
|    from req.headers        |      |    WHERE workspace_id = ctx.workspaceId  |
|  - Same validation logic   |      |  sidekiq.list:                           |
+---------------------------+      |    WHERE workspace_id = ctx.workspaceId  |
                                   +------------------------------------------+
```

**Implementation: WorkspaceProvider (Client)**

```typescript
// src/features/workspace/providers/workspace-provider.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@sidekiq/trpc/react";

const ACTIVE_WORKSPACE_KEY = "sidekiq-active-workspace-id";

interface WorkspaceContextValue {
  activeWorkspaceId: string | null;
  activeWorkspace: WorkspaceInfo | null;
  workspaces: WorkspaceInfo[];
  setActiveWorkspaceId: (id: string) => void;
  isLoading: boolean;
  isPersonal: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch workspaces (personal + teams)
  const { data: workspaces = [], isLoading } = api.workspace.list.useQuery();

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    setActiveWorkspaceIdState(stored);
    setIsInitialized(true);
  }, []);

  // Auto-select personal workspace if none selected or stored is invalid
  useEffect(() => {
    if (!isInitialized || isLoading || workspaces.length === 0) return;

    const valid = activeWorkspaceId
      ? workspaces.some((w) => w.id === activeWorkspaceId)
      : false;

    if (!valid) {
      // Default to personal workspace
      const personal = workspaces.find((w) => w.type === "personal");
      if (personal) {
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, personal.id);
        setActiveWorkspaceIdState(personal.id);
      }
    }
  }, [activeWorkspaceId, workspaces, isLoading, isInitialized]);

  const setActiveWorkspaceId = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    setActiveWorkspaceIdState(id);
  }, []);

  const activeWorkspace = activeWorkspaceId
    ? workspaces.find((w) => w.id === activeWorkspaceId) ?? null
    : null;

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspaceId,
      activeWorkspace,
      workspaces,
      setActiveWorkspaceId,
      isLoading: isLoading || !isInitialized,
      isPersonal: activeWorkspace?.type === "personal",
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
```

**Implementation: Header Injection (tRPC Client)**

```typescript
// src/trpc/react.tsx -- Modified to inject workspace header
export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({ /* ... */ }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers: () => {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");

            // Inject active workspace ID
            const workspaceId = typeof window !== "undefined"
              ? localStorage.getItem("sidekiq-active-workspace-id")
              : null;
            if (workspaceId) {
              headers.set("x-workspace-id", workspaceId);
            }

            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
```

**Implementation: workspaceProcedure (tRPC Server)**

```typescript
// src/server/api/trpc.ts -- Add workspace procedure

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });
  const workspaceId = opts.headers.get("x-workspace-id");

  return {
    db,
    session,
    workspaceId, // May be null
    ...opts,
  };
};

/**
 * Workspace-scoped procedure.
 * Validates:
 * 1. User is authenticated
 * 2. workspaceId is present in headers
 * 3. User is a member of the workspace
 *
 * Injects ctx.workspaceId and ctx.workspaceRole
 */
export const workspaceProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.workspaceId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Workspace ID required. Set X-Workspace-Id header.",
    });
  }

  // Verify membership
  const membership = await ctx.db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, ctx.workspaceId),
      eq(workspaceMembers.userId, ctx.session.user.id),
    ),
    columns: { role: true },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this workspace",
    });
  }

  return next({
    ctx: {
      workspaceId: ctx.workspaceId, // Now guaranteed non-null
      workspaceRole: membership.role,
    },
  });
});
```

**Why this approach (not URL-based):**

| Approach | Pros | Cons |
|----------|------|------|
| **Header-based (recommended)** | No URL changes, works with existing routes, simple tRPC integration | Requires consistent header setting |
| URL-based (`/w/[workspaceSlug]/chat`) | SEO-friendly, shareable URLs | Major routing rewrite, breaks all existing routes, slug management complexity |
| Cookie-based | Automatic on every request | Conflicts with auth cookies, server-side setting issues |
| Query parameter | Easy to implement | Ugly URLs, lost on navigation, SEO issues |

The header-based approach is best because:
1. It requires **zero URL changes** -- existing routes (`/chat`, `/sidekiqs`) keep working.
2. It integrates naturally with tRPC's `headers()` callback.
3. The Route Handler (`/api/chat`) can read the same header.
4. localStorage provides persistence across sessions.

### Pattern 2: Vertical Feature Slicing in Next.js App Router

**The constraint:** Next.js App Router requires pages to live in `src/app/`. Feature-Sliced Design (FSD) documentation explicitly calls this out as a known conflict.

**The solution:** Thin route files that delegate to feature modules.

```
src/app/                              src/features/
  (dashboard)/                          chat/
    chat/                                 components/
      page.tsx  ----imports-from---->       chat-interface.tsx
      [threadId]/                         server/
        page.tsx  ----imports-from---->     router.ts (threadRouter)
                                          hooks/
                                            use-auto-scroll.ts
```

**Rules for vertical slicing:**

1. **`src/app/` files are max ~20 lines.** They import a component from the feature and render it with any route params/server data.

2. **Features never import from other features' internals.** Cross-feature communication goes through:
   - The feature's barrel export (`index.ts`)
   - Shared tRPC queries (invalidation)
   - React Context (WorkspaceProvider)
   - Shared types from `src/shared/types/`

3. **Each feature has a `server/router.ts`** that exports its tRPC router. The root router imports these.

4. **Shared code lives in `src/shared/` or `src/components/ui/`**, not in any feature.

5. **The database schema stays centralized** in `src/server/db/schema.ts` because Drizzle relations require all tables in scope.

**Migration approach:** Move files feature-by-feature, updating imports as you go. The `@sidekiq/*` path alias means imports like `@sidekiq/features/chat/components/chat-interface` work immediately after moving the file.

### Pattern 3: Database Migration Strategy (teams -> workspaces)

**Current schema (relevant tables):**

```
team (id, name, owner_id, avatar, member_limit, created_at, updated_at)
team_member (team_id, user_id, role, joined_at)
team_invite (id, team_id, email, token, role, accepted_at, rejected_at, expires_at, created_at)
sidekiq (id, owner_id, team_id [nullable], name, ...)
thread (id, user_id, sidekiq_id, title, ...) -- NO team_id/workspace_id
message (id, thread_id, ...)
```

**Target schema:**

```
workspace (id, name, type [personal|team], owner_id, avatar, member_limit, created_at, updated_at)
workspace_member (workspace_id, user_id, role, joined_at)
workspace_invite (id, workspace_id, email, token, role, accepted_at, rejected_at, expires_at, created_at)
sidekiq (id, owner_id, workspace_id [NOT NULL], name, ...)
thread (id, user_id, workspace_id [NOT NULL], sidekiq_id, title, ...)
message (id, thread_id, ...) -- No change (scoped through thread)
```

**Migration SQL (single migration file):**

```sql
-- Migration: 0003_workspace_model.sql
-- Transforms team model into unified workspace model with content scoping

-- Step 1: Create workspace_type enum
CREATE TYPE workspace_type AS ENUM ('personal', 'team');

--> statement-breakpoint

-- Step 2: Rename team table to workspace and add type column
ALTER TABLE "team" RENAME TO "workspace";

--> statement-breakpoint

ALTER TABLE "workspace" ADD COLUMN "type" workspace_type NOT NULL DEFAULT 'team';

--> statement-breakpoint

-- Step 3: Rename team_member to workspace_member, update FK
ALTER TABLE "team_member" RENAME TO "workspace_member";

--> statement-breakpoint

ALTER TABLE "workspace_member" RENAME COLUMN "team_id" TO "workspace_id";

--> statement-breakpoint

-- Step 4: Rename team_invite to workspace_invite, update FK
ALTER TABLE "team_invite" RENAME TO "workspace_invite";

--> statement-breakpoint

ALTER TABLE "workspace_invite" RENAME COLUMN "team_id" TO "workspace_id";

--> statement-breakpoint

-- Step 5: Rename sidekiq.team_id to workspace_id
ALTER TABLE "sidekiq" RENAME COLUMN "team_id" TO "workspace_id";

--> statement-breakpoint

-- Step 6: Add workspace_id to threads
ALTER TABLE "thread" ADD COLUMN "workspace_id" text;

--> statement-breakpoint

-- Step 7: Create personal workspace for each existing user
-- Personal workspace: id = 'personal_' + user_id, name = 'Personal'
INSERT INTO "workspace" (id, name, type, owner_id, avatar, member_limit, created_at, updated_at)
SELECT
  'pw_' || u.id,
  'Personal',
  'personal',
  u.id,
  '{"type":"initials","color":"#6366f1"}'::jsonb,
  1,
  NOW(),
  NOW()
FROM "user" u
WHERE NOT EXISTS (
  SELECT 1 FROM "workspace" w WHERE w.owner_id = u.id AND w.type = 'personal'
);

--> statement-breakpoint

-- Step 8: Add users as members of their personal workspaces
INSERT INTO "workspace_member" (workspace_id, user_id, role, joined_at)
SELECT
  w.id,
  w.owner_id,
  'owner',
  NOW()
FROM "workspace" w
WHERE w.type = 'personal'
AND NOT EXISTS (
  SELECT 1 FROM "workspace_member" wm
  WHERE wm.workspace_id = w.id AND wm.user_id = w.owner_id
);

--> statement-breakpoint

-- Step 9: Assign existing threads to personal workspaces
UPDATE "thread" t
SET workspace_id = (
  SELECT w.id FROM "workspace" w
  WHERE w.owner_id = t.user_id AND w.type = 'personal'
)
WHERE t.workspace_id IS NULL;

--> statement-breakpoint

-- Step 10: Assign personal sidekiqs (no team) to personal workspaces
UPDATE "sidekiq" s
SET workspace_id = (
  SELECT w.id FROM "workspace" w
  WHERE w.owner_id = s.owner_id AND w.type = 'personal'
)
WHERE s.workspace_id IS NULL;

--> statement-breakpoint

-- Step 11: Make workspace_id NOT NULL now that all rows have values
ALTER TABLE "thread" ALTER COLUMN "workspace_id" SET NOT NULL;

--> statement-breakpoint

ALTER TABLE "sidekiq" ALTER COLUMN "workspace_id" SET NOT NULL;

--> statement-breakpoint

-- Step 12: Add foreign key constraints
ALTER TABLE "thread" ADD CONSTRAINT "thread_workspace_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "workspace" ("id") ON DELETE CASCADE;

--> statement-breakpoint

ALTER TABLE "sidekiq" ADD CONSTRAINT "sidekiq_workspace_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "workspace" ("id") ON DELETE SET NULL;

--> statement-breakpoint

-- Step 13: Add indexes for workspace-scoped queries
CREATE INDEX IF NOT EXISTS "thread_workspace_idx" ON "thread" ("workspace_id");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "sidekiq_workspace_idx" ON "sidekiq" ("workspace_id");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "workspace_type_idx" ON "workspace" ("type");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "workspace_owner_idx" ON "workspace" ("owner_id");

--> statement-breakpoint

-- Step 14: Rename old indexes to match new table names
-- (Drizzle will handle this via generate if table names change in schema.ts)

-- Step 15: Update the unique constraint on sidekiq name per workspace
-- Previously: unique per owner. Now: unique per workspace + owner.
DROP INDEX IF EXISTS "sidekiq_owner_name_unique";

--> statement-breakpoint

CREATE UNIQUE INDEX "sidekiq_workspace_name_unique" ON "sidekiq" ("workspace_id", LOWER("name"));
```

**Drizzle schema changes (`schema.ts`):**

```typescript
// New enum
export const workspaceTypeEnum = pgEnum("workspace_type", ["personal", "team"]);

// Renamed from teams
export const workspaces = pgTable(
  "workspace",
  {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    type: workspaceTypeEnum("type").notNull().default("team"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    avatar: jsonb("avatar")
      .$type<SidekiqAvatar>()
      .default({ type: "initials", color: "#6366f1" })
      .notNull(),
    memberLimit: integer("member_limit").notNull().default(50),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("workspace_owner_idx").on(t.ownerId),
    index("workspace_type_idx").on(t.type),
  ],
);

// Updated threads table with workspace_id
export const threads = pgTable(
  "thread",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sidekiqId: text("sidekiq_id").references(() => sidekiqs.id, {
      onDelete: "set null",
    }),
    // ... rest unchanged
  },
  (t) => [
    index("thread_user_idx").on(t.userId),
    index("thread_workspace_idx").on(t.workspaceId),
    // ... rest unchanged
  ],
);
```

**Important notes on the migration:**

1. **Drizzle Kit rename detection:** When you rename a table in `schema.ts` (e.g., `"team"` to `"workspace"`), `drizzle-kit generate` will detect it and prompt you for rename. However, writing the migration manually (as shown above) gives more control, especially for the data backfill steps.

2. **Use a hand-written migration**, not `drizzle-kit generate`, for this change. The data backfill (creating personal workspaces, assigning existing content) requires custom SQL that `generate` cannot produce.

3. **The migration is safe to run on production** because every step uses `IF NOT EXISTS` or conditional logic, and the NOT NULL constraint is only applied after backfilling.

4. **Personal workspace creation on signup** must be added to the auth flow (Better Auth `afterSignup` hook) after this migration.

## Data Flow

### Workspace Switching Flow

```
User clicks workspace in WorkspaceSwitcher
    |
    v
1. setActiveWorkspaceId(newId)
    |-- Updates React state (WorkspaceProvider)
    |-- Writes to localStorage
    |
    v
2. All tRPC queries invalidate
    |-- useQueryClient().invalidateQueries()
    |-- This is CRITICAL: stale data from old workspace must be cleared
    |
    v
3. Next tRPC request includes new X-Workspace-Id header
    |-- httpBatchStreamLink reads from localStorage
    |-- Server validates membership
    |
    v
4. All workspace-scoped queries refetch with new workspace
    |-- thread.list -> shows threads for new workspace
    |-- sidekiq.list -> shows sidekiqs for new workspace
    |
    v
5. UI updates
    |-- Sidebar shows new workspace's threads/sidekiqs
    |-- If current chat belongs to old workspace, navigate to /chat (new chat)
    |-- Workspace switcher shows new active state
```

**Key implementation detail: Query invalidation on workspace switch.**

```typescript
// In workspace-provider.tsx or use-active-workspace.ts
const queryClient = useQueryClient();

const setActiveWorkspaceId = useCallback((id: string) => {
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  setActiveWorkspaceIdState(id);

  // CRITICAL: Invalidate ALL workspace-scoped queries
  // This forces refetch with the new X-Workspace-Id header
  void queryClient.invalidateQueries();

  // If current route is a thread in the old workspace, redirect to /chat
  // (The thread.list refetch will show new workspace threads)
}, [queryClient]);
```

**Why invalidate all queries:** The X-Workspace-Id header changes globally. Every cached tRPC response is now stale because it was fetched with the old workspace ID. A targeted invalidation (`thread.list`, `sidekiq.list`) would be more efficient but risks missing a query.

### Workspace-Scoped Query Flow

**Example: thread.list query**

```
Client: api.thread.list.useQuery()
    |
    v
HTTP POST /api/trpc/thread.list
  Headers: { X-Workspace-Id: "ws_abc123" }
    |
    v
createTRPCContext:
  ctx.workspaceId = "ws_abc123" (from header)
    |
    v
workspaceProcedure middleware:
  1. Validate user is authenticated ---- (protectedProcedure)
  2. Validate workspaceId is present
  3. Query workspace_member for (workspaceId, userId)
  4. If not member -> FORBIDDEN
  5. Inject ctx.workspaceId, ctx.workspaceRole
    |
    v
thread.list procedure:
  db.query.threads.findMany({
    where: and(
      eq(threads.workspaceId, ctx.workspaceId),  // Workspace scoping
      eq(threads.isArchived, false),
    ),
    orderBy: [desc(threads.isPinned), desc(threads.lastActivityAt)],
  })
    |
    v
Response: threads in this workspace only
```

**Ownership vs. workspace scoping:**

In the current codebase, threads are scoped by `userId`:
```typescript
where: eq(threads.userId, ctx.session.user.id)
```

After the workspace model, threads are scoped by `workspaceId`:
```typescript
where: eq(threads.workspaceId, ctx.workspaceId)
```

This is a fundamental change. For personal workspaces, the user is the only member, so the behavior is identical. For team workspaces, ALL members see the same threads -- which is the desired behavior for shared workspaces.

**Note on the Route Handler (`/api/chat`):**

The Route Handler does not go through tRPC middleware, so it must independently:
1. Read `X-Workspace-Id` from the request headers
2. Validate the user is a member
3. Create threads with the correct `workspaceId`

```typescript
// In /api/chat/route.ts
const workspaceId = req.headers.get("x-workspace-id");
if (!workspaceId) {
  return new Response("Workspace ID required", { status: 400 });
}

// Validate membership (reuse a shared helper)
const isMember = await validateWorkspaceMembership(db, workspaceId, session.user.id);
if (!isMember) {
  return new Response("Forbidden", { status: 403 });
}

// Thread creation includes workspaceId
const [newThread] = await db.insert(threads).values({
  id: newThreadId,
  userId: session.user.id,
  workspaceId, // <-- NEW
  // ...
}).returning();
```

### Personal Workspace Behavior

**Auto-creation:** A personal workspace is created during the signup flow via a Better Auth `afterSignup` hook or a database trigger.

```typescript
// In better-auth config or a post-signup hook
async function createPersonalWorkspace(userId: string) {
  const workspaceId = `pw_${userId}`;

  await db.insert(workspaces).values({
    id: workspaceId,
    name: "Personal",
    type: "personal",
    ownerId: userId,
    memberLimit: 1, // Only the owner
  });

  await db.insert(workspaceMembers).values({
    workspaceId,
    userId,
    role: "owner",
  });

  return workspaceId;
}
```

**Personal workspace constraints:**
- `memberLimit = 1` -- cannot invite others
- `type = "personal"` -- UI hides invite/member features
- Cannot be deleted
- Cannot be renamed (always "Personal")
- The workspace switcher shows it with a special icon (user avatar instead of team avatar)

**Why use a real workspace row (not null/special case):**
Every query that filters by `workspaceId` works identically for personal and team workspaces. No null checks, no branching logic, no "is this personal or team?" conditionals scattered throughout the codebase. The unified model eliminates an entire class of bugs.

## Integration Points

### Files That Change (Existing -> Modified)

| Current File | Change Type | What Changes |
|-------------|-------------|-------------|
| `src/server/db/schema.ts` | MODIFY | Rename team -> workspace, add workspace_id to threads/sidekiqs, add type enum |
| `src/server/api/trpc.ts` | MODIFY | Add workspaceId to context, add workspaceProcedure |
| `src/server/api/root.ts` | MODIFY | Import routers from features/ instead of server/api/routers/ |
| `src/app/api/chat/route.ts` | MODIFY | Read X-Workspace-Id, validate membership, add workspace_id to thread creation |
| `src/trpc/react.tsx` | MODIFY | Add X-Workspace-Id header injection in httpBatchStreamLink |
| `src/app/(dashboard)/layout.tsx` | MODIFY | Wrap children in WorkspaceProvider |
| `src/middleware.ts` | NO CHANGE | Auth middleware stays the same (workspace is app-level, not route-level) |
| `tsconfig.json` | MINOR | No change needed (@sidekiq/* already covers src/) |

### Files That Move (Feature Slicing)

| Current Location | New Location |
|-----------------|--------------|
| `src/components/chat/*` | `src/features/chat/components/*` |
| `src/components/sidekiq/*` | `src/features/sidekiq/components/*` |
| `src/components/sidebar/*` | `src/features/sidebar/components/*` |
| `src/components/team/*` | `src/features/workspace/components/*` |
| `src/components/model-picker/*` | `src/features/model-picker/components/*` |
| `src/components/auth/*` | `src/features/auth/components/*` |
| `src/components/icons/*` | `src/shared/components/icons/*` |
| `src/hooks/use-active-team.ts` | `src/features/workspace/hooks/use-active-workspace.ts` |
| `src/hooks/use-auto-scroll.ts` | `src/features/chat/hooks/use-auto-scroll.ts` |
| `src/hooks/use-keyboard-shortcuts.ts` | `src/features/sidebar/hooks/use-keyboard-shortcuts.ts` |
| `src/hooks/use-model-selection.ts` | `src/features/model-picker/hooks/use-model-selection.ts` |
| `src/hooks/use-thread-actions.ts` | `src/features/sidebar/hooks/use-thread-actions.ts` |
| `src/hooks/use-thread-search.tsx` | `src/features/sidebar/hooks/use-thread-search.tsx` |
| `src/hooks/use-sidekiq-actions.ts` | `src/features/sidekiq/hooks/use-sidekiq-actions.ts` |
| `src/hooks/use-member-search.tsx` | `src/features/workspace/hooks/use-member-search.tsx` |
| `src/hooks/use-scroll-position.ts` | `src/features/chat/hooks/use-scroll-position.ts` |
| `src/hooks/use-view-preference.ts` | `src/features/sidebar/hooks/use-view-preference.ts` |
| `src/server/api/routers/thread.ts` | `src/features/chat/server/router.ts` |
| `src/server/api/routers/sidekiq.ts` | `src/features/sidekiq/server/router.ts` |
| `src/server/api/routers/team.ts` | `src/features/workspace/server/router.ts` |
| `src/server/api/routers/user.ts` | `src/features/settings/server/router.ts` (or keep in shared) |
| `src/server/api/routers/health.ts` | Stays in `src/server/api/routers/health.ts` |
| `src/lib/validations/thread.ts` | `src/features/chat/validations.ts` |
| `src/lib/validations/sidekiq.ts` | `src/features/sidekiq/validations.ts` |
| `src/lib/validations/team.ts` | `src/features/workspace/validations.ts` |
| `src/lib/validations/chat.ts` | `src/features/chat/validations.ts` (merge) |
| `src/lib/validations/user.ts` | `src/features/settings/validations.ts` |
| `src/lib/validations/auth.ts` | `src/features/auth/validations.ts` |
| `src/lib/team-permissions.ts` | `src/features/workspace/server/permissions.ts` |
| `src/lib/sidebar-utils.ts` | `src/features/sidebar/utils.ts` |
| `src/lib/date-grouping.ts` | `src/shared/utils/date-grouping.ts` |
| `src/lib/ai/*` | `src/features/chat/lib/ai/*` (or `server/ai/`) |
| `src/lib/emails/*` | `src/shared/emails/*` (used by workspace invites) |
| `src/lib/utils.ts` | `src/shared/utils/utils.ts` |
| `src/lib/types/*` | `src/shared/types/*` |
| `src/lib/constants/*` | `src/shared/constants/*` |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/features/workspace/providers/workspace-provider.tsx` | React Context for active workspace |
| `src/features/workspace/hooks/use-active-workspace.ts` | Hook wrapping workspace context |
| `src/features/workspace/components/workspace-switcher.tsx` | Sidebar workspace picker (replaces team panel) |
| `drizzle/0003_workspace_model.sql` | Database migration |

## Suggested Build Order

The refactor has two independent dimensions: structural (vertical slices) and data model (workspace). Here is the recommended sequencing.

### Phase 1: Vertical Slice Restructure (Pure Move, No Logic Changes)

**Rationale:** Get the folder structure right first. This is a low-risk, high-volume change that does not alter any behavior. Every test should pass identically before and after.

**Steps:**
1. Create `src/features/` with subdirectories for each feature.
2. Create `src/shared/` and move shared utilities.
3. Move files feature-by-feature (chat -> sidekiq -> sidebar -> auth -> model-picker -> settings).
4. Update all import paths (the `@sidekiq/*` alias means path changes but not alias changes).
5. Update `src/server/api/root.ts` to import routers from features.
6. Create barrel `index.ts` files for each feature's public API.
7. Make `src/app/` pages thin wrappers.
8. Run all tests. Fix any broken imports.

**Duration estimate:** 1-2 tasks. Mechanical but high file count.

**Risk:** Import paths are the main risk. TypeScript compiler will catch all broken imports.

### Phase 2: Database Migration (teams -> workspaces)

**Rationale:** Schema must change before server logic can use workspace scoping.

**Steps:**
1. Write and test the migration SQL (0003_workspace_model.sql).
2. Update `schema.ts` with new table names, workspace_id columns, type enum.
3. Update Drizzle relations.
4. Run migration on local dev database.
5. Verify all existing data is properly migrated (personal workspaces created, threads assigned).

**Duration estimate:** 1 task. Schema change + manual migration + verification.

**Risk:** Data backfill correctness. Test with a database snapshot.

### Phase 3: Server-Side Workspace Scoping

**Rationale:** With schema in place, add the workspace middleware and update all queries.

**Steps:**
1. Add `workspaceProcedure` to `trpc.ts`.
2. Update workspace router (rename team -> workspace, add personal workspace creation on signup).
3. Update thread router: replace `userId` scoping with `workspaceId` scoping.
4. Update sidekiq router: replace `ownerId` scoping with `workspaceId` scoping.
5. Update `/api/chat/route.ts` to read workspace header, add workspace_id to thread creation.
6. Add personal workspace creation to Better Auth signup flow.
7. Create shared `validateWorkspaceMembership()` helper for Route Handler.

**Duration estimate:** 2-3 tasks. Touches every router and the Route Handler.

**Risk:** Missing a query that still uses userId instead of workspaceId. Write tests for workspace isolation.

### Phase 4: Client-Side Workspace Context

**Rationale:** Server is ready, now wire up the client.

**Steps:**
1. Create WorkspaceProvider with React Context.
2. Modify tRPC client to inject X-Workspace-Id header.
3. Add WorkspaceProvider to dashboard layout.
4. Build workspace switcher component (sidebar icon rail).
5. Replace `useActiveTeam` with `useWorkspace`.
6. Add query invalidation on workspace switch.
7. Handle workspace-specific navigation (redirect to /chat on workspace switch).

**Duration estimate:** 2 tasks. Provider + switcher UI.

**Risk:** Header injection timing (localStorage may not be set on first render). The fallback-to-personal-workspace logic handles this.

### Phase 5: UI Integration & Polish

**Rationale:** Everything works, now polish the experience.

**Steps:**
1. Update sidebar panels to use workspace-scoped data.
2. Update settings pages for workspace management (rename "Teams" to "Workspaces").
3. Handle personal workspace UI differences (hide invite, member limit = 1).
4. Add empty states for new workspaces.
5. Handle edge cases (workspace deleted while active, removed from workspace).

**Duration estimate:** 1-2 tasks. UI updates.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Dual Scoping (userId AND workspaceId)

**What goes wrong:** Keeping `eq(threads.userId, ctx.session.user.id)` alongside `eq(threads.workspaceId, ctx.workspaceId)` in queries.

**Why bad:** In team workspaces, other members' threads should be visible. Filtering by userId defeats workspace sharing. Also adds unnecessary query complexity.

**Instead:** For content queries (threads, sidekiqs), scope ONLY by workspaceId. The workspace membership check in the middleware already validates the user has access.

**Exception:** Personal workspace threads are inherently single-user, but the query still uses workspaceId. The personal workspace just happens to have one member.

### Anti-Pattern 2: Null workspaceId for Personal Content

**What goes wrong:** Using `workspaceId = NULL` to represent "personal, not in any workspace."

**Why bad:** Every query needs `WHERE workspace_id = ? OR workspace_id IS NULL`, creating branching logic everywhere. Aggregations, counts, and joins become error-prone.

**Instead:** Create a real personal workspace row. All content has a non-null workspaceId.

### Anti-Pattern 3: Splitting Schema Across Features

**What goes wrong:** Putting thread table definition in `features/chat/server/schema.ts` and workspace table in `features/workspace/server/schema.ts`.

**Why bad:** Drizzle ORM relations require all referenced tables to be in scope. Circular imports become unavoidable (threads reference sidekiqs, sidekiqs reference workspaces, workspaces reference users).

**Instead:** Keep `src/server/db/schema.ts` as the single schema file. Features import from it.

### Anti-Pattern 4: URL-Based Workspace Routing

**What goes wrong:** Restructuring routes to `/w/[workspaceSlug]/chat/[threadId]`.

**Why bad:** Requires rewriting every route, every Link component, every router.push() call. Breaks existing bookmarks. Adds slug management complexity (uniqueness, URL encoding). Overkill for an app where workspaces are contextual, not navigational.

**Instead:** Use header-based workspace propagation. URLs stay clean.

### Anti-Pattern 5: Moving Too Fast on Both Dimensions

**What goes wrong:** Restructuring folders AND changing the data model in the same PR/task.

**Why bad:** If something breaks, you cannot tell if it was the file move or the logic change. Merge conflicts with any parallel work become massive.

**Instead:** Phase 1 (structural) ships as a standalone PR with no behavior changes. Phase 2+ (workspace model) ships separately.

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Vertical slice structure | HIGH | Verified against Next.js App Router docs, FSD documentation, and real-world examples. Adapted specifically to this codebase's conventions. |
| Database migration | HIGH | Based on direct analysis of existing schema.ts and migration patterns (0001, 0002). SQL is PostgreSQL-standard ALTER TABLE + INSERT. |
| Workspace context propagation (headers) | HIGH | tRPC middleware pattern is well-documented. Header injection via httpBatchStreamLink is standard tRPC usage. |
| Personal workspace model | HIGH | Pool-model multi-tenancy is the industry standard for unified personal/team workspaces (AWS, Citus, Checkly patterns). |
| Build order | MEDIUM | Based on dependency analysis, but task granularity may need adjustment during implementation. |
| Route Handler integration | HIGH | The existing `/api/chat/route.ts` already reads custom headers, so workspace header is a natural extension. |

## Sources

### Official Documentation
- [Next.js App Router Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) -- routing conventions
- [tRPC Middleware Documentation](https://trpc.io/docs/server/middlewares) -- context extension pattern
- [tRPC Context Documentation](https://trpc.io/docs/server/context) -- inner/outer context
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations) -- generate, push, migrate
- [Drizzle ORM Custom Migrations](https://orm.drizzle.team/docs/kit-custom-migrations) -- hand-written SQL
- [Drizzle ORM Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints) -- foreign keys

### Architecture Patterns
- [Feature-Sliced Design with Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs) -- FSD + App Router integration
- [Feature Driven Architecture for Next.js](https://medium.com/@JMauclair/feature-driven-architecture-fda-a-scalable-way-to-structure-your-next-js-applications-b8c1703a29c0) -- vertical slice approach
- [Best Practices for Next.js 15 Organization (2025)](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)

### Multi-Tenant / Workspace Patterns
- [AWS - PostgreSQL Data Access Patterns for SaaS](https://aws.amazon.com/blogs/database/choose-the-right-postgresql-data-access-pattern-for-your-saas-application/) -- pool model for shared schema
- [Checkly - Multi-tenant SaaS Data Model](https://www.checklyhq.com/blog/building-a-multi-tenant-saas-data-model/) -- account/workspace model
- [Clerk - Multi-Tenancy in React (Organization Switching)](https://clerk.com/articles/multi-tenancy-in-react-applications-guide) -- workspace switching patterns
- [AWS - Multi-tenant PostgreSQL Partitioning Models](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/partitioning-models.html)

### tRPC Multi-Tenant Context
- [tRPC Discord - Multi-tenant Config in Context](https://discord-questions.trpc.io/m/1191810200659837038) -- real-world tenant slug in context
- [tRPC GitHub Discussion #2779 - Middleware Context Types](https://github.com/trpc/trpc/discussions/2779) -- scoped middleware patterns
- [tRPC GitHub Discussion #2221 - v10 Middleware](https://github.com/trpc/trpc/discussions/2221) -- middleware implementation patterns

### Drizzle ORM Migration
- [Drizzle ORM - Known Bug: Rename + Other Changes](https://github.com/drizzle-team/drizzle-orm/issues/3826) -- migration file may miss combined changes
- [Drizzle ORM PostgreSQL Best Practices (2025)](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717)

### State Management
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025) -- Context vs Zustand for sidebar state
- [Vercel KB - React Context in Next.js](https://vercel.com/kb/guide/react-context-state-management-nextjs) -- client component context patterns
