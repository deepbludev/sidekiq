# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-27)

**Core value:** Users can chat with any LLM through custom assistants (Sidekiqs) that can be shared with their team.
**Current focus:** v0.2 Workspaces — defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-01-27 — Milestone v0.2 Workspaces started

Progress: [░░░░░░░░░░] v0.2 starting

## Milestone History

- **v0.1 Core Experience** — Phases 1-8.2 (57 plans) — Shipped 2026-01-26
  - See: .planning/MILESTONES.md
  - Archive: .planning/milestones/v0.1-ROADMAP.md

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
All v0.1 decisions documented with outcomes.
New v0.2 decisions: unified workspace model, vertical slice refactor first.

### Pending Todos

13 pending todos in `.planning/todos/pending/`:
- **Implement Projects feature** (ui)
- **Migrate next lint to ESLint CLI** (tooling)
- **Allow importing/exporting Sidekiq config from/to JSON file** (ui)
- **Sidekiq creation agent feature** (ui)
- **Mid-conversation Sidekiq switching with @mentions** (ui)
- **Sidekiq voice tone / personality feature** (ui)
- **Rich markdown editor for chat input** (ui)
- **Fix chat textarea loses focus after sending message** (ui)
- **Refactor Architecture to Vertical Slicing by Feature** (architecture) — IN v0.2
- **Rethink teams as workspaces** (architecture) — IN v0.2
- **Regenerate message button** (ui) — IN v0.2
- **Include all available models in the Vercel AI Gateway** (api) — IN v0.2
- **Message edit and chat fork options** (ui)

### Blockers/Concerns

- AI_GATEWAY_API_KEY environment variable must be configured for /api/chat to work

### Quick Tasks Completed

| # | Description | Date | Commit |
|---|-------------|------|--------|
| 001 | Change default model to google/gemini-2.0-flash | 2026-01-23 | 95b6dae |
| 002 | Analyze Convex migration (DEFER) | 2026-01-24 | e22023c |
| 003 | Add Phase 5 unit and E2E tests | 2026-01-24 | 8669e75 |
| 004 | Add Phase 6 unit tests | 2026-01-24 | a42242e |
| 005 | Add Phase 6 E2E tests | 2026-01-24 | 8b8c6fa |
| 007 | Implement database seeding for local dev | 2026-01-25 | 835d3ae |
| 008 | Fix duplicate threads on Sidekiq chat | 2026-01-25 | f0c634c |
| 009 | Update unit tests for Phase 7 | 2026-01-25 | 2c9c413 |
| 011 | Improved database seed process and README | 2026-01-25 | 28a24e8 |
| 012 | Add pirate Sidekiq "Captain Jack" to seed | 2026-01-26 | af23b0c |
| 013 | Phase 8 unit tests | 2026-01-26 | 47a4b68 |
| 014 | Fix unit tests for Phase 8.1 | 2026-01-26 | ec99974 |
| 015 | Phase 8.2 unit tests | 2026-01-26 | 693c488 |
| 016 | Fix sidekiq edit/create page vertical scroll overflow | 2026-01-26 | 2997a19 |
| 017 | Replace dashboard with /chat as default landing page | 2026-01-27 | 70233ad |
| 018 | Improved chat message metadata and fix seed emojis | 2026-01-27 | efae19b |
| 019 | Extend available emoji options for Sidekiq avatar | 2026-01-27 | d0b4afc |
| 020 | Fix conversation splits after 2nd message | 2026-01-27 | 8b77503 |

## Session Continuity

Last session: 2026-01-27
Stopped at: Starting milestone v0.2 Workspaces
Resume file: None
Next: Complete requirements and roadmap definition
