---
phase: 10
plan: 02
subsystem: database
tags: [drizzle, migration, seed, auth-hooks, workspace, databaseHooks, nanoid]

dependency-graph:
  requires: [phase-10-plan-01]
  provides: [workspace-migration-sql, workspace-seed-data, personal-workspace-auth-hook]
  affects: [phase-10-plan-03, phase-10-plan-04, phase-10-plan-05, phase-11, phase-12]

tech-stack:
  added: []
  patterns: [database-hooks-for-entity-creation, seed-with-workspace-model, manual-migration-authoring]

key-files:
  created:
    - sidekiq-webapp/drizzle/0003_workspace_migration.sql
    - sidekiq-webapp/drizzle/meta/0003_snapshot.json
  modified:
    - sidekiq-webapp/drizzle/meta/_journal.json
    - sidekiq-webapp/src/shared/db/reset-and-seed.ts
    - sidekiq-webapp/src/features/auth/api/config.ts

decisions:
  - id: d-10-02-01
    decision: "Hand-craft migration SQL instead of using drizzle-kit generate interactively"
    reason: "drizzle-kit generate requires interactive prompts for rename detection which cannot be automated in CI/headless environments; manual SQL is more reliable for complex renames"
  - id: d-10-02-02
    decision: "Create 0003_snapshot.json manually to keep drizzle-kit state in sync"
    reason: "Without a matching snapshot, future drizzle-kit generate invocations would produce incorrect diffs"
  - id: d-10-02-03
    decision: "Add workspace_id column to thread as nullable first, then SET NOT NULL"
    reason: "Defensive migration pattern even though local dev databases are wiped; handles edge case of existing rows during migration"
  - id: d-10-02-04
    decision: "No slug column on workspace seed/auth hook"
    reason: "Schema from Plan 01 does not include a slug column on the workspaces table; personal workspace is accessed by user context, not slug"

metrics:
  duration: "6 minutes"
  completed: "2026-01-28"
---

# Phase 10 Plan 02: Migration, Seed & Auth Hook Summary

**One-liner:** Drizzle migration SQL with full team-to-workspace DDL, seed script creating personal workspace with all content assigned, and Better Auth databaseHooks for automatic personal workspace on signup.

## Performance

| Metric | Value |
|--------|-------|
| Duration | 6 minutes |
| Start | 2026-01-28T01:43:23Z |
| End | 2026-01-28T01:49:06Z |
| Tasks | 3/3 |
| Files created | 2 |
| Files modified | 3 |

## Accomplishments

1. **Migration SQL (0003_workspace_migration.sql)**: 120-line migration with 30+ DDL statements covering enum rename (team_role -> workspace_role), new enum creation (workspace_type), 3 table renames, 3 column renames, 2 new columns, 1 new FK (thread.workspace_id), old FK constraint drops/recreates, old index drops, and 11 new indexes including the workspace_personal_unique partial unique index.

2. **Drizzle metadata sync**: Created 0003_snapshot.json (1100+ lines) representing the full post-migration schema state, and updated _journal.json with the 4th migration entry, keeping drizzle-kit state tracking accurate for future migrations.

3. **Seed script update (reset-and-seed.ts)**: Added SEED_PERSONAL_WORKSPACE_ID constant, personal workspace creation with workspace_member row, workspaceId on all 5 sidekiqs and 4 threads, replaced all team table references in flushAppData with workspace equivalents.

4. **Auth hook (config.ts)**: Added databaseHooks.user.create.after to betterAuth config that creates a personal workspace (name="Personal", type="personal", memberLimit=1) and workspace_member row (role="owner") using nanoid for ID generation on every new user signup.

## Task Commits

| # | Task | Commit | Type | Key Changes |
|---|------|--------|------|-------------|
| 1 | Generate Drizzle migration for workspace schema | `0d01084` | feat | Migration SQL, snapshot JSON, journal update |
| 2 | Update seed script for workspace model | `b6260cb` | feat | Workspace seed IDs, workspaceId on content, flush workspace tables |
| 3 | Add databaseHooks for personal workspace on signup | `4eb4be0` | feat | nanoid import, schema imports, databaseHooks in betterAuth config |

## Files Created/Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `sidekiq-webapp/drizzle/0003_workspace_migration.sql` | Created | Full team-to-workspace migration DDL |
| `sidekiq-webapp/drizzle/meta/0003_snapshot.json` | Created | Post-migration schema snapshot for drizzle-kit |
| `sidekiq-webapp/drizzle/meta/_journal.json` | Modified | Added 4th migration entry |
| `sidekiq-webapp/src/shared/db/reset-and-seed.ts` | Modified | Workspace model seeding, flush workspace tables |
| `sidekiq-webapp/src/features/auth/api/config.ts` | Modified | databaseHooks for personal workspace on signup |

## Decisions Made

1. **Hand-crafted migration SQL** (d-10-02-01): drizzle-kit generate requires interactive rename prompts. Since the environment cannot handle interactive CLI, the migration SQL was authored manually based on the diff between the 0002 snapshot and current schema.ts. This is also more reliable given drizzle-kit v0.30.x known bugs with combined renames.

2. **Manual snapshot creation** (d-10-02-02): Created 0003_snapshot.json to keep drizzle-kit's state tracking accurate. Without this, future `drizzle-kit generate` would produce incorrect migration diffs.

3. **Defensive nullable-then-NOT-NULL pattern** (d-10-02-03): thread.workspace_id is added as nullable first, then SET NOT NULL. This handles the edge case of existing rows during migration, even though local dev databases are wiped.

4. **No slug on workspace** (d-10-02-04): The workspace table from Plan 01 does not include a slug column (the old teams table had one, but it was removed during schema transformation). Personal workspace is accessed by user context, not by URL slug.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] drizzle-kit generate cannot run in headless/non-interactive mode**

- **Found during:** Task 1
- **Issue:** `npx drizzle-kit generate` prompts interactively for every rename ("Is X created or renamed from another enum?"). This cannot be automated since the tool requires manual selection.
- **Fix:** Hand-crafted the migration SQL based on the diff between 0002 snapshot state and current schema.ts. Also manually created the 0003_snapshot.json to keep drizzle-kit state in sync.
- **Files created:** `0003_workspace_migration.sql`, `0003_snapshot.json`
- **Commit:** `0d01084`

## Next Phase Readiness

**Plan 10-03** (workspace API layer rename) can proceed immediately. The migration SQL, seed script, and auth hook are all complete. The downstream TypeScript errors from the schema rename are still expected and will be resolved by Plans 03-05.

**Blockers:** None
**Concerns:** The migration SQL was hand-crafted rather than drizzle-kit-generated. While the snapshot should keep drizzle-kit in sync, the next `drizzle-kit generate` invocation should be verified to produce a clean diff (no unexpected changes).
