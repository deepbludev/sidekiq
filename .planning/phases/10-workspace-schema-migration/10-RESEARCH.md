# Phase 10 Research: Workspace Schema Migration

## 1. Current State Analysis

### Database Schema (schema.ts)
The entire schema lives in `/sidekiq-webapp/src/shared/db/schema.ts`. The team-related tables are:

- **`teams`** — `pgTable("team")` with columns: `id`, `name`, `ownerId`, `slug` (unique), `avatar` (jsonb), `memberLimit`, `stripeCustomerId`, `stripeSubscriptionId`, `createdAt`, `updatedAt`
- **`teamMembers`** — `pgTable("team_member")` with composite PK `(teamId, userId)`, columns: `teamId`, `userId`, `role` (team_role enum), `joinedAt`
- **`teamInvites`** — `pgTable("team_invite")` with columns: `id`, `teamId`, `email`, `token`, `role`, `acceptedAt`, `rejectedAt`, `expiresAt`, `createdAt`
- **`teamRoleEnum`** — `pgEnum("team_role", ["owner", "admin", "member"])`

Content tables referencing teams:
- **`sidekiqs`** — has `teamId` column (nullable FK to team.id, ON DELETE SET NULL)
- **`threads`** — no `teamId` or `workspaceId` column currently

### Existing Migrations
Located in `/sidekiq-webapp/drizzle/`:
- `0000_init.sql` — Better Auth tables (user, session, account, verification)
- `0001_core_models.sql` — team, team_member, team_invite, sidekiq, thread, message tables + enums + indexes
- `0002_team_schema_sync.sql` — Added admin to team_role enum, avatar/member_limit to team, sidekiq extra columns

The migration journal (`drizzle/meta/_journal.json`) tracks 3 entries. drizzle-kit version is `^0.30.5`, drizzle-orm is `^0.41.0`.

### Drizzle Configuration
`drizzle.config.ts` reads schema from `./src/shared/db/schema.ts` and uses PostgreSQL dialect.

### Team References Across Codebase (31 files)
Files referencing "team" span:
- **Schema**: `src/shared/db/schema.ts` (table definitions, relations, type exports)
- **API Router**: `src/features/workspace/api/router.ts` (teamRouter with 13 procedures)
- **Validations**: `src/features/workspace/validations.ts` (12 Zod schemas, all named `*Team*`)
- **Permissions**: `src/features/workspace/lib/permissions.ts` (TeamRole type, 8 permission functions)
- **Email**: `src/features/workspace/api/emails.ts` (sendTeamInviteEmail)
- **Hooks**: `use-active-team.ts`, `use-member-search.tsx`
- **Components**: 12 component files (team-avatar, team-create-dialog, team-settings-section, etc.)
- **Pages**: `settings/teams/page.tsx`, `invite/[token]/page.tsx`, `chat/page.tsx`
- **Shared**: `sidebar-utils.ts` (SidebarFeature type includes "teams"), `trpc/root.ts` (router key: "team")
- **Barrel**: `src/features/workspace/index.ts` (all exports use Team* naming)
- **Seed**: `src/shared/db/reset-and-seed.ts` (flushes team tables, seeds sidekiqs with teamId: null)
- **Auth config**: `src/features/auth/api/config.ts` (no team references, but needs databaseHooks for auto workspace creation)

### Better Auth Integration
Auth is configured at `/sidekiq-webapp/src/features/auth/api/config.ts` using `betterAuth()`. Currently has `emailAndPassword` and `socialProviders.github` enabled. **No `databaseHooks` are configured.** Better Auth supports `databaseHooks.user.create.after` which fires after a user is created -- this is the correct place to create the personal workspace on signup.

## 2. Discretion Areas: Research & Recommendations

### 2A. Table Strategy: Rename vs Drop-and-Create

**Option A: ALTER TABLE RENAME (Recommended)**
- PostgreSQL supports `ALTER TABLE "team" RENAME TO "workspace"` natively
- drizzle-kit generate will detect the table name change and prompt "Is workspace table in schema created or renamed from another column?" -- selecting "renamed" generates the proper ALTER statement
- Preserves table OID, existing constraints, indexes, triggers, sequences
- Works seamlessly even with foreign keys pointing to the table (they update automatically in PostgreSQL)
- Columns like `team_id` in other tables need explicit `ALTER TABLE ... RENAME COLUMN "team_id" TO "workspace_id"`

**Option B: Drop and Create Fresh**
- Since there's no production data (CONTEXT.md: "Local dev databases wiped and re-seeded"), this is technically viable
- Creates clean DDL without rename artifacts
- But loses ability to practice proper migration patterns; also requires careful ordering to drop dependents first

**Recommendation: Option A (Rename)**. Even with no production data, rename teaches the right migration pattern. drizzle-kit handles it naturally through its interactive rename prompt. The SQL is cleaner and smaller. Combined with the "wipe and re-seed" local dev approach, there's zero risk.

### 2B. Migration File Structure: Single vs Multiple Sequential

**Option A: Single Migration File (Recommended)**
- One `0003_workspace_migration.sql` that handles all DDL changes atomically
- Since there's no production data and local dev gets wiped, a single file is simplest
- drizzle-kit generate produces one file per `generate` invocation
- All schema changes (enum rename, table renames, column renames, new columns, constraint changes) in one pass

**Option B: Multiple Sequential Files**
- Split by concern: enum changes, table renames, column additions, data migration
- More granular rollback points
- But overkill for a dev-only migration with no production data

**Recommendation: Option A (Single file)**. Update the full schema.ts in one pass, run `drizzle-kit generate` once, and hand-edit the generated SQL if needed (drizzle-kit has a known bug where rename + other changes may not generate all SQL). Since dev databases are wiped and re-seeded, a single migration is pragmatic and clean.

**Important caveat:** The `ALTER TYPE team_role RENAME TO workspace_role` cannot run inside a transaction in PostgreSQL. drizzle-kit handles this with `statement-breakpoint` comments, but verify the generated SQL separates this correctly.

### 2C. Workspace Table Fields Beyond Teams

Current team columns: `id`, `name`, `ownerId`, `slug`, `avatar`, `memberLimit`, `stripeCustomerId`, `stripeSubscriptionId`, `createdAt`, `updatedAt`

New fields needed:
- **`type`** (REQUIRED) — `pgEnum("workspace_type", ["personal", "team"])` with NOT NULL constraint. This is the core discriminator.
- **`description`** (OPTIONAL, recommend: YES) — `varchar(500)`, nullable. Mirrors sidekiq description. Useful for team workspaces to describe purpose. Personal workspace gets null.
- **`userId`** (RECOMMENDED) — For personal workspaces, a direct FK to user. Enables a UNIQUE constraint `(userId, type)` filtered to type='personal' to enforce exactly one personal workspace per user. For team workspaces this would be null (ownership is via ownerId).

**Recommendation:**
- Add `type` column (required by CONTEXT.md)
- Add `description` (varchar(500), nullable) -- low cost, high future value
- Do NOT add a separate `userId` column -- the existing `ownerId` already serves this purpose for personal workspaces. Enforce the "one personal workspace per user" constraint via a partial unique index: `CREATE UNIQUE INDEX "workspace_personal_unique" ON "workspace" ("owner_id") WHERE "type" = 'personal'`
- Keep `memberLimit` for both types (personal defaults to 1, team defaults to 50)
- Keep Stripe fields on both types (CONTEXT.md: "Both workspace types can have Stripe billing fields")
- Fix the personal workspace `slug` to `"personal"` per CONTEXT.md. Enforce via CHECK constraint or application logic.

### 2D. Personal Workspace Ownership: Explicit workspace_members Row vs Implied

**Option A: Explicit workspace_members row (Recommended)**
- Personal workspace owner gets a `workspace_members` row with role "owner", just like team workspaces
- Queries for "all workspaces this user belongs to" use a single query pattern: join workspace_members
- Permission checks work identically for both workspace types
- The `list` procedure in the workspace router doesn't need special-casing

**Option B: Implied via ownerId FK**
- Personal workspace has no workspace_members row; ownership is inferred from ownerId
- Requires dual query paths: workspace_members for teams, ownerId for personal
- Permission functions need branching logic based on workspace type
- Simpler schema but more complex application code

**Recommendation: Option A (Explicit row)**. The unified query pattern eliminates special-casing in every router procedure. The cost is one extra row per user in workspace_members, which is negligible. The workspace router `list` procedure currently queries `teamMembers` with a join to `team` -- this pattern works seamlessly if personal workspaces also have a members row.

### 2E. Invite Table Migration Approach

Current table: `team_invite` with columns: `id`, `teamId`, `email`, `token`, `role`, `acceptedAt`, `rejectedAt`, `expiresAt`, `createdAt`

**Approach: Rename table and columns in place**
- `ALTER TABLE "team_invite" RENAME TO "workspace_invite"`
- `ALTER TABLE "workspace_invite" RENAME COLUMN "team_id" TO "workspace_id"`
- Update FK constraint name from `team_invite_team_id_team_id_fk` to `workspace_invite_workspace_id_workspace_id_fk`
- Update index names from `team_invite_*` to `workspace_invite_*`

No structural changes needed to the invite table itself -- the `role` column still uses the workspace_role enum (renamed from team_role), and the flow remains the same: invite someone by email to a workspace.

**Note:** Personal workspaces will NOT use invites (invites are a team-workspace-only feature). This is enforced at the application layer, not the schema layer, since there's no reason to add a CHECK constraint blocking invite rows for personal workspaces.

## 3. Technical Implementation Details

### 3A. Enum Rename Strategy

PostgreSQL supports `ALTER TYPE "team_role" RENAME TO "workspace_role"` directly. The existing enum values (`owner`, `admin`, `member`) remain unchanged -- these are role names, not team-specific terminology.

Similarly for the new workspace_type enum:
```sql
CREATE TYPE "workspace_type" AS ENUM ('personal', 'team');
```

In Drizzle schema.ts:
```typescript
export const workspaceRoleEnum = pgEnum("workspace_role", ["owner", "admin", "member"]);
export const workspaceTypeEnum = pgEnum("workspace_type", ["personal", "team"]);
```

### 3B. Schema.ts Changes Summary

Tables to rename (Drizzle name -> DB name):
- `teams` -> `workspaces` (pgTable("workspace"))
- `teamMembers` -> `workspaceMembers` (pgTable("workspace_member"))
- `teamInvites` -> `workspaceInvites` (pgTable("workspace_invite"))

Columns to add:
- `workspaces.type` — workspaceTypeEnum, NOT NULL
- `workspaces.description` — varchar(500), nullable
- `threads.workspaceId` — text, NOT NULL, FK to workspace.id

Columns to rename:
- `sidekiqs.teamId` -> `sidekiqs.workspaceId`
- `teamMembers.teamId` -> `workspaceMembers.workspaceId`
- `teamInvites.teamId` -> `workspaceInvites.workspaceId`

New indexes:
- `workspace_personal_unique` — partial unique on `(owner_id)` WHERE `type = 'personal'`
- `thread_workspace_idx` — on `threads.workspace_id`
- `workspace_type_idx` — on `workspaces.type`

Relations to update:
- All `teamsRelations`, `teamMembersRelations`, `teamInvitesRelations` renamed to workspace equivalents
- `sidekiqsRelations` and `threadsRelations` updated for new workspace FK

### 3C. databaseHooks for Personal Workspace Creation

In `/sidekiq-webapp/src/features/auth/api/config.ts`, add:

```typescript
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        // Create personal workspace for new user
        await db.insert(workspaces).values({
          id: nanoid(),
          name: "Personal",
          type: "personal",
          slug: "personal",
          ownerId: user.id,
          memberLimit: 1,
        });
        // Also create workspace_member row
        await db.insert(workspaceMembers).values({
          workspaceId: workspaceId, // from above insert
          userId: user.id,
          role: "owner",
        });
      },
    },
  },
},
```

This hooks into better-auth's user creation lifecycle. Per CONTEXT.md: "For new signups: created at signup time in auth callback (not lazy). If creation fails during first load: block the app and retry."

The retry logic is an application-level concern handled in a middleware or layout component -- if a user exists but has no personal workspace, show a blocking retry screen. This is a UI concern for a later sub-plan, but the schema and hook must be correct from the start.

### 3D. Seed Script Updates

`/sidekiq-webapp/src/shared/db/reset-and-seed.ts` must be updated:
- Replace all `schema.teams` -> `schema.workspaces`, `schema.teamMembers` -> `schema.workspaceMembers`, `schema.teamInvites` -> `schema.workspaceInvites`
- Seed data factories: sidekiq `teamId` -> `workspaceId`
- Add personal workspace creation in seed: create workspace for E2E test user, add workspace_member row, assign threads to that workspace
- Flush order: messages -> threads -> sidekiqs -> workspaceInvites -> workspaceMembers -> workspaces

### 3E. Full Codebase Rename Scope

**API layer (server-side):**
| File | Changes |
|------|---------|
| `workspace/api/router.ts` | `teamRouter` -> `workspaceRouter`, all `teamId` -> `workspaceId`, `teams` -> `workspaces`, etc. |
| `workspace/api/emails.ts` | `sendTeamInviteEmail` -> `sendWorkspaceInviteEmail`, param names |
| `workspace/validations.ts` | All schema names: `createTeamSchema` -> `createWorkspaceSchema`, types: `TeamAvatar` -> `WorkspaceAvatar` |
| `workspace/lib/permissions.ts` | `TeamRole` -> `WorkspaceRole`, function names stay (canInvite, canRemoveMember, etc. -- these are role-based, not team-specific) |
| `shared/trpc/root.ts` | Router key: `team` -> `workspace` |
| `shared/db/schema.ts` | Full table/column/relation/type renames as described in 3B |
| `shared/db/reset-and-seed.ts` | Table references, seed data |
| `auth/api/config.ts` | Add databaseHooks for personal workspace |

**Client-side:**
| File | Changes |
|------|---------|
| All 12 `workspace/components/team-*.tsx` | Rename files: `team-avatar.tsx` -> `workspace-avatar.tsx`, etc. Internal references |
| `workspace/hooks/use-active-team.ts` | -> `use-active-workspace.ts`, localStorage key, types |
| `workspace/hooks/use-member-search.tsx` | `TeamMember` -> `WorkspaceMember` |
| `workspace/index.ts` | All barrel exports renamed |
| `settings/teams/page.tsx` | -> `settings/workspaces/page.tsx` (or leave URL, rename internals) |
| `invite/[token]/page.tsx` | Internal "team" -> "workspace" text |
| `chat/page.tsx` | Any team references |
| `shared/lib/sidebar-utils.ts` | SidebarFeature: "teams" -> "workspaces" |
| `shared/layout/sidebar-*` | Team sidebar references |

**API call sites (tRPC):**
Every `api.team.*` call becomes `api.workspace.*`. This affects all UI components that call team endpoints.

**Total estimated file count: ~35 files** need changes (31 files with "team" references + a few new files for workspace creation logic).

## 4. Risk Assessment & Edge Cases

### Low Risk (no production data)
- No data migration risk -- dev databases wiped and re-seeded
- No backwards compatibility needed -- clean break per CONTEXT.md
- No downtime concerns -- local development only

### drizzle-kit Generation Caveats
- **Rename detection:** drizzle-kit will prompt interactively during `generate` for every rename. With 3 tables + multiple columns being renamed, expect 10+ prompts. Answer "renamed" for each.
- **Known bug:** drizzle-kit v0.30.x may miss constraint/type changes when combined with renames. After generation, manually inspect the SQL and add any missing ALTER statements.
- **Enum rename:** `ALTER TYPE ... RENAME TO` cannot run in a transaction block. The generated migration must use `statement-breakpoint` to separate this. drizzle-kit should handle this, but verify.
- **New enum:** `CREATE TYPE workspace_type` must come before any column that uses it. drizzle-kit orders these correctly.

### Constraint Rename
PostgreSQL constraint names are not automatically renamed when tables are renamed. If the generated migration doesn't rename constraints (e.g., `team_owner_id_user_id_fk`), they'll still work but have misleading names. This is cosmetic and can be handled post-migration or ignored for dev.

### Index Rename
Similarly, index names like `team_owner_idx` become stale after table rename. drizzle-kit may drop and recreate indexes. If not, use `ALTER INDEX "team_owner_idx" RENAME TO "workspace_owner_idx"`.

## 5. Dependency Analysis

### Phase 9 Completion (prerequisite)
Phase 9 (vertical slice architecture) is complete per git history. The `@sidekiq/workspace/*` path alias already exists. The feature directory structure is in place. No blocking dependencies.

### What This Phase Does NOT Do
- No workspace switcher UI (later phase)
- No workspace creation via UI (out of scope per CONTEXT.md)
- No multi-workspace query filtering (later phase)
- No workspace-level permissions beyond existing team permissions
- No URL routing changes (workspace slug in URL -- later phase)

## 6. Implementation Order (for planning reference)

Suggested sequence for the planner:

1. **Schema changes** — Update schema.ts with all renames, new columns, new enum, new relations
2. **Generate migration** — Run `drizzle-kit generate`, answer rename prompts, verify SQL
3. **Seed script** — Update reset-and-seed.ts for new table/column names + personal workspace seeding
4. **Auth hook** — Add databaseHooks in auth config for personal workspace creation on signup
5. **API layer** — Rename router, validations, permissions, email utility
6. **Client layer** — Rename components, hooks, barrel exports, pages
7. **Shared utilities** — Update sidebar-utils, trpc root router
8. **Wipe and verify** — Drop local DB, run migrations, seed, verify app works

## 7. Open Questions for Planning

1. **Router key rename:** Changing `team` -> `workspace` in `root.ts` is a breaking change for all tRPC client calls. Should this be done atomically with all component updates, or should we temporarily alias both?
   - **Recommendation:** Atomic rename. Since all code changes happen in one phase and there's no production traffic, do it all at once.

2. **File rename strategy:** Should `team-avatar.tsx` become `workspace-avatar.tsx`, or should components keep their current file names since the feature directory is already `workspace/`?
   - **Recommendation:** Rename files. The CONTEXT.md says "Full rename across the codebase" and the component names should match the domain model for consistency.

3. **Settings URL:** Currently `/settings/teams`. Should this become `/settings/workspaces`?
   - **Recommendation:** Yes, rename to `/settings/workspaces` for consistency with the domain model rename.

4. **Personal workspace member limit:** The `memberLimit` field currently defaults to 50 (for teams). Personal workspaces should default to 1 (only the owner). How to enforce?
   - **Recommendation:** Set `memberLimit: 1` in the seed and auth hook when creating personal workspaces. No schema-level enforcement needed.
