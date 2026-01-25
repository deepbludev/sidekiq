# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Users can chat with any LLM through custom assistants (Sidekiqs) that can be shared with their team.
**Current focus:** Phase 7 - Sidekiq Chat Integration (COMPLETE)

## Current Position

Phase: 7 of 13 (Sidekiq Chat Integration)
Plan: 8 of 8 complete (all gap closure plans done)
Status: Phase complete (all gaps closed)
Last activity: 2026-01-25 - Completed all Phase 7 gap closure plans (07-07, 07-08)

Progress: [███████░░░] ~58% (7 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 27
- Average duration: ~6.9 min
- Total execution time: ~3 hours 8 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2 | 39min | 19.5min |
| 02 | 3 | 18min | 6min |
| 03 | 5 | 17min | 3.4min |
| 04 | 4 | 17min | 4.25min |
| 05 | 5 | 58min | 11.6min |
| 06 | 4 | 56min | 14min |
| 07 | 8 | 34min | ~4min |

**Recent Trend:**
- Last 5 plans: 07-05 (4min), 07-06 (4min), 07-07 (3min), 07-08 (1min)
- Trend: Phase 7 all gap closures complete! Ready for Phase 8

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
- Fuse.js threshold 0.4 for typo tolerance (confirmed - 04-02)
- HoverCard openDelay 400ms for non-jarring display (confirmed - 04-02)
- Favorites section hidden during search (confirmed - 04-02)
- TooltipProvider at picker level for nested tooltips (confirmed - 04-02)
- Client/server module split for server-only imports (confirmed - 04-03)
- Optimistic updates with tRPC mutation rollback pattern (confirmed - 04-03)
- Model sent via sendMessage body option for per-message flexibility (confirmed - 04-03)
- Render prop pattern for model switch hints (confirmed - 04-03)
- ComponentPropsWithoutRef for Radix asChild prop forwarding (confirmed - 04-04)
- localStorage key 'sidebar-collapsed' for sidebar state persistence (confirmed - 05-01)
- SSR-safe lazy useState initializer pattern for hydration compatibility (confirmed - 05-01)
- Pinned threads only in Pinned group, not duplicated in date groups (confirmed - 05-01)
- Sidebar widths: 288px expanded (w-72), 64px collapsed (w-16) (confirmed - 05-02)
- 200ms ease-out transition for sidebar collapse animation (confirmed - 05-02)
- Icon rail pattern for collapsed sidebar (New Chat, Sidekiqs, Settings) (confirmed - 05-02)
- Scroll position in ref (not state) to avoid re-renders (confirmed - 05-03)
- Flattened groups with discriminated union for virtualization (confirmed - 05-03)
- TanStack Virtual overscan of 5 items for smooth scrolling (confirmed - 05-03)
- Fuse.js with threshold 0.4 for thread search (confirmed - 05-04, matches 04-02 pattern)
- 200ms debounce for search performance (confirmed - 05-04)
- Flat list (no date grouping) during active search (confirmed - 05-04)
- Cmd+K keyboard shortcut for search focus (confirmed - 05-04)
- Sheet side='left' for mobile drawer (confirmed - 05-05)
- cloneElement pattern for onThreadSelect callback injection (confirmed - 05-05)
- Event delegation for thread click handling in virtualized list (confirmed - 05-05)
- authClient.useSession() for user data in footer (confirmed - 05-05)
- Custom in-memory rate limiter instead of @trpc-limiter/memory (confirmed - 06-01)
- 25 creations/hour limit for Sidekiq anti-spam (confirmed - 06-01)
- Case-insensitive name uniqueness via SQL LOWER() (confirmed - 06-01)
- djb2 hash algorithm for deterministic avatar colors (confirmed - 06-02)
- Optimistic updates for sidekiq delete and toggleFavorite (confirmed - 06-02)
- localStorage key 'sidekiq-view-preference' for grid/list toggle (confirmed - 06-02)
- Sidebar Sidekiq click navigates to /chat?sidekiq={id} (implemented - 07-05, supersedes 06-03)
- Type-to-confirm delete with exact name match (confirmed - 06-03)
- Sidebar shows max 5 Sidekiqs with favorites first (confirmed - 06-03)
- Separate sidekiqFormSchema without Zod defaults for React Hook Form (confirmed - 06-04)
- useWatch with explicit type narrowing for avatar fields (confirmed - 06-04)
- beforeunload warning for unsaved form changes (confirmed - 06-04)
- Runtime system message injection for Sidekiq (not stored in DB) (confirmed - 07-01)
- effectiveSidekiqId pattern for new vs existing threads (confirmed - 07-01)
- Sidekiq ownership verification before use (confirmed - 07-01)
- Thread list with sidekiq relation for sidebar display (confirmed - 07-01)
- Owner-only access check for sidekiq query param, team access deferred to Phase 8 (confirmed - 07-02)
- Model selection priority: thread > sidekiq > user > default (confirmed - 07-02)
- sidekiqId passed in transport body for new Sidekiq chats (confirmed - 07-02)
- SidekiqIndicator conditional wrapper (button vs div) for onClick support (confirmed - 07-03)
- ChatHeader breadcrumb style: Sidekiq / Thread Title (confirmed - 07-03)
- Input badge shows 'Chatting with [name]' for active Sidekiq (confirmed - 07-03)
- Sidekiq avatar replaces pin indicator in sidebar thread item (confirmed - 07-04)
- Deleted Sidekiq graceful degradation with "?" and "[Sidekiq deleted]" (confirmed - 07-04)
- Thread type extended in date-grouping.ts as single source of truth (confirmed - 07-04)
- Sidebar Sidekiq item with dropdown menu for edit access (confirmed - 07-05)
- Start Chat button added to Sidekiq cards (grid/list views) and edit page (confirmed - 07-05)
- Cmd+Shift+S keyboard shortcut for Sidekiq picker (confirmed - 07-06)
- Fuse.js threshold 0.4 for Sidekiq picker fuzzy search (confirmed - 07-06, matches 04-02 pattern)
- Sidekiq avatar shown inline at start of AI messages (confirmed - 07-06)
- Thread page loads sidekiq relation with drizzle 'with' clause for context restoration (confirmed - 07-06)
- deletedSidekiqName column stores Sidekiq name before deletion for graceful UI degradation (confirmed - 07-07)
- Branching via parentMessageId ready for v2 (pending)
- GitHub OAuth only for v1 (pending)
- DEFER Convex migration - PostgreSQL/Drizzle has no pain points, reconsider at Phase 8-9 (confirmed - quick-002)

### Pending Todos

7 pending todos in `.planning/todos/pending/`:
- **Implement Projects feature** (ui) — workspace grouping chats, knowledge base, team sharing
- **Rethink branding and UI to match Linear aesthetic** (ui)
- **Migrate next lint to ESLint CLI** (tooling)
- **Allow importing/exporting Sidekiq config from/to JSON file** (ui)
- **Fix Cmd+N shortcut conflicting with browser new window** (ui)
- **Sidekiq creation agent feature** (ui) — create a Sidekiq by chatting similar to GPT Builder
- **E2E tests with isolated test database** (testing) — fresh seeded data per test run

### Blockers/Concerns

- AI_GATEWAY_API_KEY environment variable must be configured for /api/chat to work

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Change default model to google/gemini-2.0-flash | 2026-01-23 | 95b6dae | [001-change-the-default-model-to-google-gemin](./quick/001-change-the-default-model-to-google-gemin/) |
| 002 | Analyze Convex migration (DEFER) | 2026-01-24 | e22023c | [002-analyze-convex-migration-as-postgresql-r](./quick/002-analyze-convex-migration-as-postgresql-r/) |
| 003 | Add Phase 5 unit and E2E tests | 2026-01-24 | 8669e75 | [003-update-test-suite-with-phase-5-unit-and-](./quick/003-update-test-suite-with-phase-5-unit-and-/) |
| 004 | Add Phase 6 unit tests | 2026-01-24 | a42242e | [004-update-test-suite-with-phase-6-verificat](./quick/004-update-test-suite-with-phase-6-verificat/) |
| 005 | Add Phase 6 E2E tests | 2026-01-24 | 8b8c6fa | [005-implement-e2e-tests-for-phase-6-sidekiq-](./quick/005-implement-e2e-tests-for-phase-6-sidekiq-/) |
| 007 | Implement database seeding for local dev | 2026-01-25 | 835d3ae | [007-implement-database-seeding-for-local-dev](./quick/007-implement-database-seeding-for-local-dev/) |

### Roadmap Evolution

- Phase 13 added: Refactor architecture to vertical slicing by feature

## Session Continuity

Last session: 2026-01-25
Stopped at: Completed 07-07-PLAN.md (Deleted Sidekiq Display Fix - gap closure)
Resume file: None
Next: Phase 8 (Team Sidekiqs)

## Phase 2 Completion Summary

All 3 plans executed successfully:

| Plan | Focus | Status |
|------|-------|--------|
| 02-01 | Theme system + glassmorphism foundation | Complete |
| 02-02 | Markdown rendering + message actions | Complete |
| 02-03 | Empty state + final integration | Complete |

**Verification:** 19/19 must-haves passed
**Requirements:** CHAT-11, UIUX-01, UIUX-02, UIUX-03, UIUX-09 marked Complete

## Phase 3 Completion Summary

All 5 plans executed successfully:

| Plan | Focus | Status |
|------|-------|--------|
| 03-01 | Thread router and routing structure | Complete |
| 03-02 | Thread creation on first message + auto-title | Complete |
| 03-03 | Thread actions UI | Complete |
| 03-04 | Stream abortion fix (gap closure) | Complete |
| 03-05 | Browser tab title fix (gap closure) | Complete |

**Verification:** 6/6 must-haves passed
**Requirements:** CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09 complete
**Components Ready:** ThreadItem, DeleteThreadDialog, RenameThreadInput, ThreadContextMenu
**Hook Ready:** useThreadActions with optimistic updates
**Note:** Thread action components await sidebar integration (Phase 5)
**Gap closure 1:** 03-04 fixed stream abortion during URL update (window.history.replaceState instead of router.replace)
**Gap closure 2:** 03-05 fixed browser tab title via SSR generateMetadata and title polling

## Phase 4 Completion Summary

All 4 plans executed successfully:

| Plan | Focus | Status |
|------|-------|--------|
| 04-01 | Foundation (schema, metadata, shadcn) | Complete |
| 04-02 | Model picker component | Complete |
| 04-03 | Persistence and integration | Complete |
| 04-04 | Model picker fix (gap closure) | Complete |

**Components Ready:** ModelPicker, ModelPickerTrigger, ModelPickerContent, ModelItem, ModelHoverCard, ProviderIcon, ModelSwitchHint
**Hooks Ready:** useModelSelection with optimistic updates for user preferences
**Routers Ready:** userRouter with getPreferences and updateModelPreferences
**Patterns Established:**
- Popover + Command pattern for picker UI
- Fuse.js fuzzy search with threshold 0.4
- HoverCard for model details
- Client/server module split (models-metadata.ts vs models.ts)
- tRPC optimistic updates with rollback
- Render prop pattern for model hints

**Verification:** 22/22 must-haves passed (re-verified after gap closure)
**Requirements:** CHAT-02, CHAT-03 marked Complete
**Gap closure 1:** Thread page wasn't passing activeModel to ChatInterface — fixed by adding activeModel column to query and initialModel prop
**Gap closure 2:** Model picker dropdown wasn't opening — fixed by forwarding rest props (including onClick) from PopoverTrigger to Button element

**Architecture Note:** models.ts split into client-safe models-metadata.ts and server-only models.ts to prevent server-only import errors in client components.

**Pattern Note:** Radix UI asChild requires child components to spread ...props to receive event handlers.

## Phase 5 Completion Summary

All 5 plans executed successfully:

| Plan | Focus | Status |
|------|-------|--------|
| 05-01 | Thread grouping and sidebar structure | Complete |
| 05-02 | Collapsed sidebar with icon rail | Complete |
| 05-03 | Virtualized thread list | Complete |
| 05-04 | Thread search with fuzzy matching | Complete |
| 05-05 | Mobile drawer and footer | Complete |

**Components Ready:** Sidebar, SidebarHeader, SidebarCollapsed, SidebarThreadList, SidebarThreadGroup, SidebarSearch, SidebarFooter, SidebarMobile
**Hooks Ready:** useThreadActions (from Phase 3)
**Patterns Established:**
- Collapsible sidebar with localStorage persistence
- Virtualized list with TanStack Virtual
- Fuse.js fuzzy search with debounce
- Sheet drawer for mobile
- Event delegation for thread selection

**Verification:** All SIDE requirements passed
**Requirements:** SIDE-01 through SIDE-05 complete, SIDE-06 deferred to Phase 7

**SIDE Requirements Status:**
- SIDE-01: History sorted by lastActivityAt (via thread.list query)
- SIDE-02: Pinned at top (via grouping)
- SIDE-03: Date grouping (Pinned/Today/Yesterday/etc.)
- SIDE-04: Search by title with fuzzy matching
- SIDE-05: Scroll position preserved (via ref tracking)
- SIDE-06: DEFERRED to Phase 7 (threads need sidekiqId for Sidekiq filtering)

## Phase 6 Completion Summary

All 7 plans executed successfully:

| Plan | Focus | Status |
|------|-------|--------|
| 06-01 | Schema + tRPC router | Complete |
| 06-02 | Utilities + hooks | Complete |
| 06-03 | List page + sidebar | Complete |
| 06-04 | Create form + preview | Complete |
| 06-05 | Conversation starters + instructions | Complete |
| 06-06 | Avatar customization | Complete |
| 06-07 | Edit page + templates | Complete |

**Verification:** 7/7 must-haves passed
**Requirements:** KIQQ-01, KIQQ-02, KIQQ-03, KIQQ-06, KIQQ-08, KIQQ-09, KIQQ-10 complete
**Deferred:** KIQQ-07 (100 Sidekiqs limit) to subscription system

**Components Ready:**
- SidekiqForm (325 lines) - React Hook Form + Zod validation
- StarterTemplates - 8 pre-built templates
- ConversationStarters - drag-drop reorderable list
- InstructionsEditor - markdown with preview
- AvatarPicker - initials/emoji + color selection
- SidekiqCard, SidekiqListItem - grid/list views
- DeleteSidekiqDialog - type-to-confirm

**Patterns Established:**
- Template-first create flow
- Split layout form with live preview
- @dnd-kit for drag-drop reordering
- Optimistic updates for delete/favorite
- Sliding window rate limiting

## Phase 7 Completion Summary

All 6 plans executed successfully:

| Plan | Focus | Status |
|------|-------|--------|
| 07-01 | Backend sidekiqId and system message injection | Complete |
| 07-02 | Frontend URL handling and ChatInterface integration | Complete |
| 07-03 | Sidekiq indicator in chat header and input | Complete |
| 07-04 | Sidebar visual indicators (avatar, subtitle) | Complete |
| 07-05 | Chat entry points from Sidekiq UI | Complete |
| 07-06 | Final integration (picker, shortcut, avatar, resume) | Complete |
| 07-07 | Deleted Sidekiq display fix (gap closure) | Complete |
| 07-08 | Model picker in Sidekiq form (gap closure) | Complete |

**Components Ready:**
- SidekiqPicker - Command palette with fuzzy search
- SidekiqIndicator - Contextual indicator with popover
- ChatHeader - Breadcrumb style with Sidekiq name
- ChatInput - "Chatting with [name]" badge
- MessageItem - Sidekiq avatar on AI messages

**Features Complete:**
- Cmd+Shift+S opens Sidekiq picker
- /chat?sidekiq={id} URL pattern
- System message injection at runtime
- Conversation starters from Sidekiq config
- Thread resume with full context restoration
- Sidebar shows Sidekiq avatar and "with [name]" subtitle

**Requirements Status:**
- KIQQ-04: Chat with Sidekiq (complete)
- KIQQ-05: Sidekiq context in messages (complete)
- SIDE-06: Sidekiq filtering in sidebar (complete)

**Gap Closure:**
- 07-07: Deleted Sidekiq display fix - added deletedSidekiqName column to preserve Sidekiq name when deleted (complete)
- 07-08: Model picker added to Sidekiq form - users can now set default model when creating/editing Sidekiqs (complete)
