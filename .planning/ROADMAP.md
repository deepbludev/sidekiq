# Roadmap: Sidekiq

## Overview

Sidekiq v1 builds upon existing authentication and database infrastructure to deliver a premium AI chat experience with custom assistants (Sidekiqs) and team collaboration. The roadmap progresses from core streaming infrastructure through chat UI, thread management, Sidekiq features, and team sharing, with UI polish and error handling integrated throughout rather than deferred to the end. This brownfield project leverages Next.js 15, tRPC 11, and Vercel AI SDK to deliver model-agnostic AI conversations with a glassmorphism aesthetic from day one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: AI Streaming Infrastructure** - Vercel AI SDK, Route Handlers, SSE
- [x] **Phase 2: Basic Chat Interface** - Message UI, input, optimistic updates
- [x] **Phase 3: Thread Management** - Create, delete, archive, pin, auto-title
- [x] **Phase 4: Model Selection & Persistence** - Model picker, sticky selection
- [x] **Phase 5: Sidebar & Navigation** - History, date grouping, search
- [x] **Phase 6: Sidekiq CRUD** - Create, edit, delete custom assistants
- [x] **Phase 7: Sidekiq Chat Integration** - Chat with Sidekiq, system prompt injection
- [x] **Phase 8: Team Foundation** - Create teams, member management, invites
- [x] **Phase 8.1: Rethink Branding and UI to Match Linear Aesthetic** - Design system overhaul (INSERTED)
- [ ] **Phase 8.2: Two-Tier Sidebar Navigation Architecture** - Icon rail + contextual panels (INSERTED)
- [ ] **Phase 9: Team Sidekiq Sharing** - Share Sidekiqs with teams, permissions
- [ ] **Phase 10: Error Handling & Edge Cases** - Comprehensive error states, retry logic
- [ ] **Phase 11: UI Polish & Animations** - Glassmorphism refinement, micro-animations
- [ ] **Phase 12: Performance & Production** - Loading states, responsive, markdown
- [ ] **Phase 13: Refactor Architecture to Vertical Slicing by Feature** - Reorganize codebase structure

## Phase Details

### Phase 1: AI Streaming Infrastructure
**Goal**: User can send a message and receive a streaming AI response using Vercel AI SDK
**Depends on**: Nothing (brownfield - auth and schema exist)
**Requirements**: CHAT-01, CHAT-10, CHAT-12
**Success Criteria** (what must be TRUE):
  1. User sends a message and sees a streaming AI response token-by-token
  2. Messages are persisted to database with model, tokens, and metadata
  3. Streaming shows typing indicator followed by token-by-token rendering
  4. Backend properly consumes stream even if client disconnects
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — AI SDK backend infrastructure (packages, model registry, /api/chat route handler)
- [x] 01-02-PLAN.md — Chat UI with streaming (useChat, message components, typing indicator, auto-scroll)

### Phase 2: Basic Chat Interface
**Goal**: User can send and view messages with optimistic UI and proper error handling
**Depends on**: Phase 1
**Requirements**: CHAT-11, UIUX-01, UIUX-02, UIUX-03, UIUX-09
**Success Criteria** (what must be TRUE):
  1. User sees their message instantly when sent (optimistic UI)
  2. Failed messages show error toast and are removed with rollback
  3. Chat interface has glassmorphism aesthetic with translucent backdrops and blur effects
  4. Dark/Light/System theme toggle works correctly across all UI elements
  5. Empty state shows "Start your first conversation" CTA for new users
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Theme system + glassmorphism foundation (next-themes, glass utilities, toggle-group)
- [x] 02-02-PLAN.md — Markdown rendering + message actions (Streamdown, copy/edit/regenerate, scroll-to-bottom)
- [x] 02-03-PLAN.md — Empty state + final integration (categorized prompts, error toasts, header with toggle)

### Phase 3: Thread Management
**Goal**: User can organize conversations with create, delete, archive, pin, and rename
**Depends on**: Phase 2
**Requirements**: CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09
**Success Criteria** (what must be TRUE):
  1. User can create a new conversation thread
  2. Thread title is auto-generated after first user message and AI response exchange
  3. User can manually edit thread title
  4. User can delete a thread with confirmation dialog (permanent removal)
  5. User can archive a thread (soft delete, recoverable)
  6. User can pin a thread to keep it at top of sidebar
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md — Thread tRPC router + routing structure (/chat, /chat/[threadId])
- [x] 03-02-PLAN.md — Thread creation on first message + auto-title generation
- [x] 03-03-PLAN.md — Thread action UI components (context menu, delete dialog, hover actions)
- [x] 03-04-PLAN.md — [gap closure] Stream abortion fix (history API for URL update)
- [x] 03-05-PLAN.md — [gap closure] Browser tab title display (SSR + dynamic update)

### Phase 4: Model Selection & Persistence
**Goal**: User can select which LLM model to use and selection persists per thread
**Depends on**: Phase 3
**Requirements**: CHAT-02, CHAT-03
**Success Criteria** (what must be TRUE):
  1. User sees a model picker dropdown near the chat input
  2. User can select from available models (GPT-4o, Claude, etc.)
  3. Selected model persists for the entire thread (sticky per thread)
  4. Different threads can use different models independently
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — Schema extensions + model metadata (user preferences JSONB, extended ModelConfig, shadcn components)
- [x] 04-02-PLAN.md — Model picker component (fuzzy search, favorites, provider groups, hover cards)
- [x] 04-03-PLAN.md — Chat integration + persistence (wire picker, user preferences tRPC, model switch hints)
- [x] 04-04-PLAN.md — [gap closure] Fix model picker dropdown not opening (forward rest props)

### Phase 5: Sidebar & Navigation
**Goal**: User can browse conversation history with search, date grouping, and visual indicators
**Depends on**: Phase 4
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04, SIDE-05
**Deferred**: SIDE-06 (Sidekiq visual indicators) -> Phase 7 (threads don't have sidekiqId until Sidekiq Chat Integration)
**Success Criteria** (what must be TRUE):
  1. Sidebar shows conversation history sorted by lastActivityAt (most recent first)
  2. Pinned threads appear at top of sidebar regardless of activity
  3. Threads are grouped by date (Today / Yesterday / This Week / Older)
  4. User can search threads by title and content
  5. Scroll position is preserved when switching between threads
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — Foundation (deps, sidebar state hook, keyboard shortcuts, date grouping)
- [x] 05-02-PLAN.md — Sidebar layout (header, collapsed icon rail, layout integration)
- [x] 05-03-PLAN.md — Thread list with virtualization and date groups
- [x] 05-04-PLAN.md — Thread search with fuzzy matching
- [x] 05-05-PLAN.md — Mobile drawer and footer with user menu

### Phase 6: Sidekiq CRUD
**Goal**: User can create, edit, and delete custom AI assistants (Sidekiqs)
**Depends on**: Phase 5
**Requirements**: KIQQ-01, KIQQ-02, KIQQ-03, KIQQ-06, KIQQ-08, KIQQ-09, KIQQ-10
**Deferred**: KIQQ-07 (100 Sidekiqs limit) -> subscription-based limits in future milestone
**Success Criteria** (what must be TRUE):
  1. User can create a Sidekiq with name, description, and instructions (system prompt)
  2. User can edit their Sidekiq's name, description, and instructions
  3. User can delete their Sidekiq
  4. Sidekiqs show text initial avatars (colored circles with initials)
  5. User is limited to 25 Sidekiq creations per hour (anti-spam rate limiting)
  6. Instructions are validated (max 8000 characters per CONTEXT.md)
  7. Empty state shows "Create your first Sidekiq" with CTA
**Plans**: 7 plans

Plans:
- [x] 06-01-PLAN.md — Schema extensions + tRPC router (CRUD with rate limiting)
- [x] 06-02-PLAN.md — Dependencies + utilities (avatar, hooks, view preference)
- [x] 06-03-PLAN.md — List page + empty state + sidebar section
- [x] 06-04-PLAN.md — Create form with split layout and live preview
- [x] 06-05-PLAN.md — Conversation starters (drag-drop) + instructions editor (markdown)
- [x] 06-06-PLAN.md — Avatar customization (color picker + emoji picker)
- [x] 06-07-PLAN.md — Edit page + templates + final verification

### Phase 7: Sidekiq Chat Integration
**Goal**: User can start a chat with a Sidekiq and see its personality in responses
**Depends on**: Phase 6
**Requirements**: KIQQ-04, KIQQ-05, SIDE-06
**Success Criteria** (what must be TRUE):
  1. User can start a chat with a Sidekiq from the Sidekiq list
  2. Sidekiq's instructions are prepended as system message (not stored in message history)
  3. UI clearly indicates which Sidekiq is currently active in a conversation
  4. Messages from Sidekiq-based conversations reflect the custom instructions
  5. Sidekiq chats show visual indicator in sidebar (icon, badge, subtitle with Sidekiq name)
**Plans**: 10 plans

Plans:
- [x] 07-01-PLAN.md — Backend foundation: sidekiqId in chat schema, system message injection, thread list relation
- [x] 07-02-PLAN.md — Chat page Sidekiq integration: URL param handling, empty state with conversation starters
- [x] 07-03-PLAN.md — Active Sidekiq UI indicators: SidekiqIndicator component, chat header, input area badge
- [x] 07-04-PLAN.md — Sidebar visual indicators: thread item Sidekiq avatar and subtitle, deleted Sidekiq handling
- [x] 07-05-PLAN.md — Chat entry points: sidebar click, list page actions, edit page button
- [x] 07-06-PLAN.md — Final integration: SidekiqPicker dialog, Cmd+Shift+S shortcut, AI message avatar, thread resume
- [x] 07-07-PLAN.md — [gap closure] Deleted Sidekiq handling: preserve name in threads before delete
- [x] 07-08-PLAN.md — [gap closure] Model selector in Sidekiq form: add ModelPicker to create/edit
- [x] 07-09-PLAN.md — [gap closure] Model state fix: reset model picker on Sidekiq switch
- [x] 07-10-PLAN.md — [gap closure] Force ChatInterface remount on Sidekiq switch via key prop

### Phase 8: Team Foundation
**Goal**: User can create teams and manage members with invite system
**Depends on**: Phase 7
**Requirements**: TEAM-01, TEAM-02, TEAM-03, TEAM-04, TEAM-05, TEAM-06, TEAM-11
**Success Criteria** (what must be TRUE):
  1. User can create a team with a name
  2. User can view team members and their roles
  3. Team owner can invite members via email (token-based secure link)
  4. Team invites expire after 7 days
  5. Team owner can revoke pending invites
  6. Team owner can remove members from the team
  7. Invite recipient clicks link, authenticates if needed, and auto-joins team
**Plans**: 8 plans

Plans:
- [x] 08-01-PLAN.md — Schema extension: admin role, team avatar, memberLimit, validation schemas, permission helpers
- [x] 08-02-PLAN.md — Team tRPC router: CRUD, member management, invite system, ownership transfer
- [x] 08-03-PLAN.md — Team UI components: TeamAvatar, dialogs (delete, remove, invite), member search hook
- [x] 08-04-PLAN.md — Team settings UI: member list, invites list, team settings section
- [x] 08-05-PLAN.md — Invite acceptance page: public page at /invite/[token] with auth flow
- [x] 08-06-PLAN.md — Team creation flow: form, create dialog, empty state, settings page integration
- [x] 08-07-PLAN.md — Sidebar integration: team dropdown, teams section, active team persistence
- [ ] 08-08-PLAN.md — [gap closure] Database migration sync: add admin role, avatar, memberLimit columns

### Phase 8.1: Rethink Branding and UI to Match Linear Aesthetic (INSERTED)
**Goal**: Overhaul the design system and UI to match Linear.app's minimalist, professional, polished aesthetic
**Depends on**: Phase 8
**Requirements**: None (design/UX improvement)
**Success Criteria** (what must be TRUE):
  1. Design system analyzed and documented (Linear's colors, spacing, typography, motion patterns)
  2. Current glassmorphism approach evaluated against Linear's more solid/subtle style
  3. Component redesigns applied (sidebar, inputs, buttons, cards, etc.)
  4. Branding elements updated (accent colors, iconography, overall feel)
  5. Dark-mode-first aesthetic with premium, clean look across all existing pages
**Plans:** 8 plans

Plans:
- [x] 08.1-01-PLAN.md — Design system foundation (globals.css tokens, font swap, glass removal)
- [x] 08.1-02-PLAN.md — UI primitives (16 shadcn components: card, dialog, button, input, etc.)
- [x] 08.1-03-PLAN.md — Auth components + page layouts (hardcoded zinc removal, brand name)
- [x] 08.1-04-PLAN.md — Chat components (editor-like input, header bar, message styling)
- [x] 08.1-05-PLAN.md — Sidebar + thread components (active state, brand, section styling)
- [x] 08.1-06-PLAN.md — Sidekiq + model picker components (cards, pickers, forms)
- [x] 08.1-07-PLAN.md — Team components (settings, dialogs, member rows)
- [x] 08.1-08-PLAN.md — Brand icon + final sweep + visual verification checkpoint

### Phase 8.2: Two-Tier Sidebar Navigation Architecture (INSERTED)
**Goal**: Refactor sidebar into a two-tier navigation structure with primary icon rail and contextual secondary panels
**Depends on**: Phase 8.1
**Requirements**: None (architectural improvement)
**Success Criteria** (what must be TRUE):
  1. Primary sidebar with thin icon rail for main features (Chats, Sidekiqs, Teams, Settings)
  2. Secondary sidebar with contextual content panel (thread list, team members, etc.)
  3. Feature switching via primary icons with appropriate secondary panel display
  4. Animations/transitions between feature contexts
  5. Scalable structure that accommodates future feature additions
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd:plan-phase 8.2 to break down)

### Phase 9: Team Sidekiq Sharing
**Goal**: User can share Sidekiqs with their team and control permissions
**Depends on**: Phase 8
**Requirements**: TEAM-07, TEAM-08, TEAM-09, TEAM-10
**Success Criteria** (what must be TRUE):
  1. User can share a Sidekiq with their team (teamId assignment)
  2. Team members can view and use team-shared Sidekiqs
  3. Sidekiq owner controls edit permissions via canTeamEdit flag
  4. When team is deleted, team Sidekiqs transfer to owner (with confirmation dialog)
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Error Handling & Edge Cases
**Goal**: User receives clear feedback and recovery options when errors occur
**Depends on**: Phase 9
**Requirements**: ERRR-01, ERRR-02, ERRR-03, ERRR-04
**Success Criteria** (what must be TRUE):
  1. Failed message sends show error toast and remove the failed message
  2. Streaming failures are detected and show retry option
  3. Network errors show user-friendly messages (not raw error codes)
  4. Rate limit errors show clear feedback with wait time
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

### Phase 11: UI Polish & Animations
**Goal**: User experiences smooth, delightful interactions with polished animations
**Depends on**: Phase 10
**Requirements**: UIUX-04, UIUX-05, UIUX-06
**Success Criteria** (what must be TRUE):
  1. Messages appear with micro-animations (fade-in/slide-up)
  2. Page transitions are smooth and responsive
  3. All interactive elements have hover states
  4. Glassmorphism aesthetic is refined with subtle gradients throughout interface
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

### Phase 12: Performance & Production
**Goal**: User experiences fast, responsive app with proper loading states on all devices
**Depends on**: Phase 11
**Requirements**: UIUX-07, UIUX-08, UIUX-10, UIUX-11
**Success Criteria** (what must be TRUE):
  1. Skeleton loading states appear for sidebar and chat area
  2. Streaming indicator with cursor animation shows during AI response
  3. Responsive design works with sidebar as drawer on mobile devices
  4. Markdown rendering works for AI responses (code blocks, tables, lists)
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

### Phase 13: Refactor Architecture to Vertical Slicing by Feature
**Goal**: Reorganize codebase from horizontal layers to vertical feature slices for better maintainability
**Depends on**: Phase 12
**Requirements**: None (internal refactor)
**Success Criteria** (what must be TRUE):
  1. Code is organized by feature domain (chat, sidekiq, team, etc.) rather than technical layer
  2. Each feature slice contains its own components, hooks, API routes, and types
  3. Cross-cutting concerns (auth, db, ui primitives) remain in shared locations
  4. All existing functionality continues to work after reorganization
**Plans**: TBD

Plans:
- [ ] 13-01: TBD (run /gsd:plan-phase 13 to break down)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 8.1 -> 8.2 -> 9 -> 10 -> 11 -> 12 -> 13

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. AI Streaming Infrastructure | 2/2 | Complete | 2026-01-22 |
| 2. Basic Chat Interface | 3/3 | Complete | 2026-01-23 |
| 3. Thread Management | 5/5 | Complete | 2026-01-23 |
| 4. Model Selection & Persistence | 4/4 | Complete | 2026-01-23 |
| 5. Sidebar & Navigation | 5/5 | Complete | 2026-01-24 |
| 6. Sidekiq CRUD | 7/7 | Complete | 2026-01-24 |
| 7. Sidekiq Chat Integration | 10/10 | Complete | 2026-01-25 |
| 8. Team Foundation | 8/8 | Complete | 2026-01-25 |
| 8.1. Rethink Branding/UI (INSERTED) | 8/8 | Complete | 2026-01-26 |
| 8.2. Two-Tier Sidebar Navigation (INSERTED) | 0/? | Not started | - |
| 9. Team Sidekiq Sharing | 0/1 | Not started | - |
| 10. Error Handling & Edge Cases | 0/1 | Not started | - |
| 11. UI Polish & Animations | 0/1 | Not started | - |
| 12. Performance & Production | 0/1 | Not started | - |
| 13. Refactor Architecture to Vertical Slicing | 0/1 | Not started | - |
