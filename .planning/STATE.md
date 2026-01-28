# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-27)

**Core value:** Users can chat with any LLM through custom assistants (Sidekiqs) that can be shared with their team.
**Current focus:** v0.2 Workspaces -- Phase 10 in progress

## Current Position

Phase: 10 of 14 (Workspace Schema Migration)
Plan: 1 of 5 in current phase
Status: In progress
Last activity: 2026-01-28 -- Completed 10-01-PLAN.md (schema transformation)

Progress: [██░░░░░░░░] v0.2 ~20% (1/6 phases complete, 1/5 plans in phase 10)

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

### Pending Todos

13 pending todos in `.planning/todos/pending/`:
- **Refactor Architecture to Vertical Slicing by Feature** (architecture) -- DONE in Phase 9
- **Rethink teams as workspaces** (architecture) -- IN v0.2 Phases 10-12
- **Regenerate message button** (ui) -- IN v0.2 Phase 14
- **Include all available models in the Vercel AI Gateway** (api) -- IN v0.2 Phase 14
- 9 other pending todos (not in v0.2 scope)

### Blockers/Concerns

- AI_GATEWAY_API_KEY environment variable must be configured for /api/chat to work
- TypeScript build is broken until Plans 10-02 through 10-05 complete the team->workspace rename across codebase
- Phase 11 (Authorization) requires audit of all 30+ queries across 5 routers + chat route

## Session Continuity

Last session: 2026-01-28
Stopped at: Completed 10-01-PLAN.md (workspace schema transformation)
Resume file: None
Next: 10-02-PLAN.md (migration generation, seed script, auth hook)
