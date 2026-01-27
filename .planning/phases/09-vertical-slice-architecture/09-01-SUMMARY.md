---
phase: 09-vertical-slice-architecture
plan: 01
subsystem: architecture
tags: [tsconfig, vitest, drizzle, next-config, path-aliases, vertical-slices, shared-infrastructure]
requires: []
provides:
  - "Path aliases for 7 feature slices + shared + ui + fallback"
  - "Directory skeleton for features/ and shared/ under src/"
  - "All shared server infrastructure relocated to src/shared/"
  - "All imports updated across ~100 files"
affects:
  - 09-02 (shared UI migration depends on shared/ structure)
  - 09-03 (chats feature slice depends on path aliases)
  - 09-04 (sidekiqs + AI slices depend on path aliases)
  - 09-05 (auth + user + workspace slices depend on path aliases)
  - 09-06 (barrel files + root router wiring depend on all prior moves)
tech-stack:
  added: []
  patterns:
    - "Feature-scoped path aliases with wildcard fallback"
    - "Array-form Vitest aliases with regex for wildcard resolution order"
    - "Shared infrastructure under src/shared/ (db, trpc, lib, env, constants)"
key-files:
  created:
    - sidekiq-webapp/src/features/ (directory skeleton for 7 features)
    - sidekiq-webapp/src/shared/ (db, trpc, lib, constants, ui, icons, theme, layout)
  modified:
    - sidekiq-webapp/tsconfig.json (path aliases)
    - sidekiq-webapp/vitest.config.ts (mirrored aliases)
    - sidekiq-webapp/drizzle.config.ts (schema path + env import)
    - sidekiq-webapp/next.config.js (env.js import path)
    - ~100 source and test files (import path updates)
key-decisions:
  - decision: "Use specific feature aliases before wildcard fallback to ensure correct resolution order"
    reason: "TypeScript resolves paths in order; specific aliases must match first to avoid fallback intercepting feature imports"
  - decision: "Use array-form aliases in vitest.config.ts with regex patterns for wildcard resolution"
    reason: "Object-form aliases do not support resolution order or regex patterns; array-form gives explicit control"
  - decision: "Move only health router now; keep feature routers in server/api/routers/ for later plans"
    reason: "Health router is cross-cutting (not feature-specific); feature routers move in plans 03-05"
  - decision: "Use @sidekiq/shared/* path for all relocated infrastructure"
    reason: "Explicit shared/ prefix makes cross-feature dependencies visible in imports"
duration: ~12 minutes
completed: 2026-01-27
---

# Phase 9 Plan 1: Config Foundation + Shared Server Infrastructure Summary

Configured TypeScript/Vitest/Drizzle path aliases for 7 feature slices + shared infrastructure, created the full directory skeleton, and relocated 16 shared server files (db, tRPC, lib, env, constants) to `src/shared/` with all ~100 import statements updated across the codebase.

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~12 minutes |
| Start | 2026-01-27T21:02:08Z |
| End | 2026-01-27T21:14:34Z |
| Tasks | 2/2 |
| Files changed | 111 |
| Tests passing | 664/664 (34 test files) |

## Accomplishments

1. **Directory skeleton created** -- Full `features/` structure for 7 slices (chats, sidekiqs, auth, user, ai, workspace, billing) with components/hooks/api subdirectories, plus `shared/` structure (db, trpc, lib, constants, ui, icons, theme, layout)

2. **Path aliases configured** -- tsconfig.json updated with 17 path mappings: 7 feature barrel aliases, 7 feature wildcard aliases, shared/*, ui/*, and the @sidekiq/* fallback. Vitest aliases mirror these using array-form with regex patterns for wildcard resolution order.

3. **Config files updated** -- drizzle.config.ts points to `shared/db/schema.ts`, next.config.js imports from `shared/env.js`

4. **16 files relocated to shared/** -- Database (3 files: index.ts, schema.ts, reset-and-seed.ts), tRPC infrastructure (6 files: trpc.ts, root.ts, health.ts, react.tsx, server.ts, query-client.ts), library utilities (5 files: utils.ts, avatar.ts, date-grouping.ts, blob.ts, sidebar-utils.ts), environment (env.js), constants (emoji-data.ts)

5. **All imports updated** -- ~100 files across app/, components/, hooks/, server/, lib/, and tests/ updated from old paths (@sidekiq/server/db, @sidekiq/trpc/react, @sidekiq/lib/utils, @sidekiq/env, etc.) to new @sidekiq/shared/* paths

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create directory skeleton and update all config files | ba222c7 | tsconfig.json, vitest.config.ts, drizzle.config.ts, next.config.js |
| 2 | Move shared server infrastructure and fix all imports | af7c938 | 16 files moved to shared/, ~100 import updates |

## Files Created/Modified

### Created (directories)
- `sidekiq-webapp/src/features/{chats,sidekiqs,auth,user,ai,workspace,billing}/` with subdirs
- `sidekiq-webapp/src/shared/{db,trpc/routers,lib,constants,ui,icons,theme,layout}/`

### Moved (16 files)
- `server/db/{index,schema,reset-and-seed}.ts` -> `shared/db/`
- `server/api/{trpc,root}.ts` -> `shared/trpc/`
- `server/api/routers/health.ts` -> `shared/trpc/routers/`
- `trpc/{react.tsx,server.ts,query-client.ts}` -> `shared/trpc/`
- `lib/{utils,date-grouping,blob,sidebar-utils}.ts` -> `shared/lib/`
- `lib/utils/avatar.ts` -> `shared/lib/avatar.ts` (flattened)
- `env.js` -> `shared/env.js`
- `lib/constants/emoji-data.ts` -> `shared/constants/`

### Modified (config)
- `tsconfig.json` -- 17 path aliases
- `vitest.config.ts` -- Mirrored aliases with array-form + regex
- `drizzle.config.ts` -- Schema path + env import
- `next.config.js` -- env.js import path

### Modified (imports updated, ~100 files)
- All UI components in `components/ui/` (cn import)
- All sidebar, chat, sidekiq, team, thread components
- All hooks (use-active-team, use-model-selection, etc.)
- All server routers (team, sidekiq, thread, user)
- App pages and API routes
- 7 test files

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Specific aliases before wildcard fallback | TypeScript resolves in order; prevents fallback intercepting feature imports |
| Array-form vitest aliases with regex | Object-form lacks resolution order control; regex needed for wildcard patterns |
| Only health router moved now | Health is cross-cutting; feature routers move in plans 03-05 |
| @sidekiq/shared/* path convention | Makes cross-feature dependencies explicit and visible in imports |
| Flatten lib/utils/avatar.ts to shared/lib/avatar.ts | Remove unnecessary nesting; avatar utils are a standalone module |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Dynamic import of @sidekiq/env in team router**
- **Found during:** Task 2
- **Issue:** `team.ts` line 455 used `await import("@sidekiq/env")` (dynamic import), not caught by static import grep
- **Fix:** Updated to `await import("@sidekiq/shared/env")`
- **Files modified:** `src/server/api/routers/team.ts`
- **Commit:** af7c938

**2. [Rule 3 - Blocking] E2E global-setup.ts used relative import to reset-and-seed**
- **Found during:** Task 2
- **Issue:** `tests/e2e/global-setup.ts` imported via relative path `../../src/server/db/reset-and-seed` instead of alias
- **Fix:** Updated to `../../src/shared/db/reset-and-seed`
- **Files modified:** `tests/e2e/global-setup.ts`
- **Commit:** af7c938

**3. [Rule 3 - Blocking] drizzle.config.ts env import needed updating**
- **Found during:** Task 2 (tsc verification)
- **Issue:** drizzle.config.ts still had `@sidekiq/env` import after env.js moved
- **Fix:** Updated to `@sidekiq/shared/env`
- **Files modified:** `drizzle.config.ts`
- **Commit:** af7c938

## Issues Encountered

None. All file moves, import updates, and verifications completed successfully on the first pass.

## Next Phase Readiness

Plan 09-02 (Shared UI, icons, theme, sidebar layout migration) is unblocked:
- Directory skeleton exists at `shared/ui/`, `shared/icons/`, `shared/theme/`, `shared/layout/`
- Path aliases `@sidekiq/ui/*` and `@sidekiq/shared/*` are configured
- All shared infrastructure is in place for feature slice migrations
