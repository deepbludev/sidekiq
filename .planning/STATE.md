# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Users can chat with any LLM through custom assistants (Sidekiqs) that can be shared with their team.
**Current focus:** Phase 4 - Model Selection & Persistence

## Current Position

Phase: 4 of 13 (Model Selection & Persistence)
Plan: 1 of 3 complete
Status: In progress
Last activity: 2026-01-23 — Completed 04-01-PLAN.md (foundation for model picker)

Progress: [███░░░░░░░] ~27% (3/13 phases complete, 1/3 phase 4 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: ~7 min
- Total execution time: ~1 hour 17 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2 | 39min | 19.5min |
| 02 | 3 | 18min | 6min |
| 03 | 5 | 17min | 3.4min |
| 04 | 1 | 3min | 3min |

**Recent Trend:**
- Last 5 plans: 03-03 (5min), 03-04 (2min), 03-05 (2min), 04-01 (3min)
- Trend: Very fast execution (~3min avg for last 4 plans)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Vercel AI Gateway for LLM access (confirmed - implemented in 01-01)
- SSE for streaming, not WebSockets (confirmed - implemented in 01-01)
- Server-side message ID generation with nanoid (confirmed - 01-01)
- User message saved immediately, AI message in onFinish (confirmed - 01-01)
- AI SDK v6 useChat hook for frontend state management (confirmed - 01-02)
- Smart auto-scroll with scroll position tracking (confirmed - 01-02)
- Passthrough validation for AI SDK message parts (confirmed - 01-02)
- Thread routing: /chat for new, /chat/[threadId] for existing (confirmed - 03-01)
- Thread router with CRUD operations via tRPC (confirmed - 03-01)
- Streamdown for streaming markdown (confirmed - 02-02)
- one-dark-pro Shiki theme for dark mode code (confirmed - 02-03)
- Minimal lines style, not bubbles (confirmed - 02-02)
- next-themes with attribute="class" for Tailwind dark mode (confirmed - 02-01)
- Mounted state pattern for hydration-safe theme components (confirmed - 02-01)
- Toaster position at bottom-center per design spec (confirmed - 02-01)
- Glassmorphism with backdrop-blur utilities (confirmed - 02-01)
- Budget model (gpt-4o-mini) for all title generation (confirmed - 03-02)
- Fire-and-forget title generation, non-blocking (confirmed - 03-02)
- X-Thread-Id header for new thread notification (confirmed - 03-02)
- window.history.replaceState for URL update without unmount (confirmed - 03-04, replaced router.replace)
- Optimistic updates with cache rollback for thread actions (confirmed - 03-03)
- Toast with undo for archive, 5 second window (confirmed - 03-03)
- generateMetadata for SSR browser tab title (confirmed - 03-05)
- Title polling every 2s, max 5 attempts for async title (confirmed - 03-05)
- UserPreferences JSONB with optional fields for extensibility (confirmed - 04-01)
- JSONB default {} for nullable preferences (confirmed - 04-01)
- ModelFeature type for capability tags (confirmed - 04-01)
- getProviders() helper for picker UI grouping (confirmed - 04-01)
- Branching via parentMessageId ready for v2 (pending)
- GitHub OAuth only for v1 (pending)

### Pending Todos

1 pending todo in `.planning/todos/pending/`:
- **Rethink branding and UI to match Linear aesthetic** (ui)

### Blockers/Concerns

- AI_GATEWAY_API_KEY environment variable must be configured for /api/chat to work

### Roadmap Evolution

- Phase 13 added: Refactor architecture to vertical slicing by feature

## Session Continuity

Last session: 2026-01-23
Stopped at: Completed 04-01-PLAN.md (foundation for model picker)
Resume file: None
Next: 04-02-PLAN.md (model picker component)

## Phase 2 Completion Summary

All 3 plans executed successfully:

| Plan | Focus | Status |
|------|-------|--------|
| 02-01 | Theme system + glassmorphism foundation | ✓ Complete |
| 02-02 | Markdown rendering + message actions | ✓ Complete |
| 02-03 | Empty state + final integration | ✓ Complete |

**Verification:** 19/19 must-haves passed
**Requirements:** CHAT-11, UIUX-01, UIUX-02, UIUX-03, UIUX-09 marked Complete

## Phase 3 Completion Summary

All 5 plans executed successfully:

| Plan | Focus | Status |
|------|-------|--------|
| 03-01 | Thread router and routing structure | ✓ Complete |
| 03-02 | Thread creation on first message + auto-title | ✓ Complete |
| 03-03 | Thread actions UI | ✓ Complete |
| 03-04 | Stream abortion fix (gap closure) | ✓ Complete |
| 03-05 | Browser tab title fix (gap closure) | ✓ Complete |

**Verification:** 6/6 must-haves passed
**Requirements:** CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09 complete
**Components Ready:** ThreadItem, DeleteThreadDialog, RenameThreadInput, ThreadContextMenu
**Hook Ready:** useThreadActions with optimistic updates
**Note:** Thread action components await sidebar integration (Phase 5)
**Gap closure 1:** 03-04 fixed stream abortion during URL update (window.history.replaceState instead of router.replace)
**Gap closure 2:** 03-05 fixed browser tab title via SSR generateMetadata and title polling
