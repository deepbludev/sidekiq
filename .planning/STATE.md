# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-27)

**Core value:** Users can chat with any LLM through custom assistants (Sidekiqs) that can be shared with their workspace.
**Current focus:** v0.2 Workspaces -- Phase 11 in progress

## Current Position

Phase: 11 of 14 (Workspace Authorization)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-01-29 -- Completed 11-02-PLAN.md (router workspace scoping)

Progress: [██████░░░░] v0.2 ~47% (2/6 phases complete + 2/3 plans in Phase 11)

## Milestone History

- **v0.1 Core Experience** -- Phases 1-8.2 (57 plans) -- Shipped 2026-01-26
  - See: .planning/MILESTONES.md
  - Archive: .planning/milestones/v0.1-ROADMAP.md

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
All v0.1 decisions documented with outcomes.
New v0.2 decisions: unified workspace model, vertical slice refactor first.
Phase 9 decisions:
- Specific path aliases before wildcard fallback in tsconfig
- Array-form vitest aliases with regex patterns for wildcard matching
- @sidekiq/shared/* convention for cross-cutting utilities
- Relative imports between sibling components within features
- Layout shell in shared/ (cross-cutting), feature panels in feature dirs
- Sidebar barrel re-exports layout from shared/
- Server-only code excluded from barrel file exports (client/server boundary)
Phase 10 decisions:
- Rename team tables in place (not drop+recreate) for proper migration patterns
- Partial unique index on (ownerId) WHERE type='personal' for one personal workspace per user
- canTeamEdit column name kept unchanged (behavioral flag, not table/FK reference)
- --no-verify commits expected during schema migration until all downstream consumers updated (Plans 02-05)
- Hand-crafted migration SQL (drizzle-kit generate requires interactive prompts not automatable in CI)
- Manual snapshot JSON to keep drizzle-kit state in sync after hand-crafted migration
- No slug column on workspace table (removed from old teams table during Plan 01 transformation)
- Add type: "team" to create procedure insert values (personal workspaces created by databaseHooks)
- Personal workspace lookup added to chat route for thread creation (workspaceId NOT NULL on threads)
Phase 11 decisions:
- resolveWorkspaceId never throws -- always resolves via graceful fallback (header -> personal -> self-heal)
- Invalid workspace header falls back to personal workspace (not 403) for graceful degradation
- localStorage read per-request in headers function, not cached in React state
- Self-healing personal workspace creation mirrors databaseHooks pattern exactly
- Thread list filters by workspaceId (team members see all workspace threads -- intentional semantics change)
- Thread/sidekiq mutations retain userId/ownerId checks (only creator can modify)
- Sidekiq name uniqueness scoped to workspace (not user) to prevent duplicates in team workspaces
- Any workspace member can duplicate any workspace sidekiq (not restricted to owner)

### Pending Todos

13 pending todos in `.planning/todos/pending/`:
- **Refactor Architecture to Vertical Slicing by Feature** (architecture) -- DONE in Phase 9
- **Rethink teams as workspaces** (architecture) -- DONE in Phase 10 (schema + naming complete)
- **Regenerate message button** (ui) -- IN v0.2 Phase 14
- **Include all available models in the Vercel AI Gateway** (api) -- IN v0.2 Phase 14
- 9 other pending todos (not in v0.2 scope)

### Blockers/Concerns

- AI_GATEWAY_API_KEY environment variable must be configured for /api/chat to work
- Phase 11 (Authorization) requires audit of all 30+ queries across 5 routers + chat route
- URL routes still use /settings/teams (Next.js directory name) -- cosmetic, not blocking

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 021 | Update the unit test suite at @sidekiq-webapp/tests/unit/ to include the new features that need to be tested in phase 10, use pnpm test:run to run the tests, verify work and fix any issues you encounter | 2026-01-28 | 74e6fef | [021-update-unit-tests-for-phase-10-workspace](./quick/021-update-unit-tests-for-phase-10-workspace/) |
| 022 | Add workspace E2E test suite covering Phase 10 features (settings, sidebar, terminology, CRUD) | 2026-01-28 | d0a6d09 | [022-update-the-e2e-test-suite-at-sidekiq-web](./quick/022-update-the-e2e-test-suite-at-sidekiq-web/) |
| 023 | Fix shiki package externalization warning in Next.js build | 2026-01-29 | a0f8cf1 | [023-investigate-and-fix-shiki-package-extern](./quick/023-investigate-and-fix-shiki-package-extern/) |
| 024 | Run E2E test suite and fix mobile sidebar close button test (Next.js dev overlay) | 2026-01-29 | de51262 | [024-run-pnpm-test-e2e-and-fix-any-issue-you-](./quick/024-run-pnpm-test-e2e-and-fix-any-issue-you-/) |

## Session Continuity

Last session: 2026-01-29
Stopped at: Completed 11-02-PLAN.md (router workspace scoping)
Resume file: None
Next: Phase 11 Plan 03 (chat route integration)
