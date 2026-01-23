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
- [ ] **Phase 4: Model Selection & Persistence** - Model picker, sticky selection
- [ ] **Phase 5: Sidebar & Navigation** - History, date grouping, search
- [ ] **Phase 6: Sidekiq CRUD** - Create, edit, delete custom assistants
- [ ] **Phase 7: Sidekiq Chat Integration** - Chat with Sidekiq, system prompt injection
- [ ] **Phase 8: Team Foundation** - Create teams, member management, invites
- [ ] **Phase 9: Team Sidekiq Sharing** - Share Sidekiqs with teams, permissions
- [ ] **Phase 10: Error Handling & Edge Cases** - Comprehensive error states, retry logic
- [ ] **Phase 11: UI Polish & Animations** - Glassmorphism refinement, micro-animations
- [ ] **Phase 12: Performance & Production** - Loading states, responsive, markdown

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
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — Thread tRPC router + routing structure (/chat, /chat/[threadId])
- [x] 03-02-PLAN.md — Thread creation on first message + auto-title generation
- [x] 03-03-PLAN.md — Thread action UI components (context menu, delete dialog, hover actions)
- [x] 03-04-PLAN.md — [gap closure] Stream abortion fix (history API for URL update)

### Phase 4: Model Selection & Persistence
**Goal**: User can select which LLM model to use and selection persists per thread
**Depends on**: Phase 3
**Requirements**: CHAT-02, CHAT-03
**Success Criteria** (what must be TRUE):
  1. User sees a model picker dropdown near the chat input
  2. User can select from available models (GPT-4o, Claude, etc.)
  3. Selected model persists for the entire thread (sticky per thread)
  4. Different threads can use different models independently
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Sidebar & Navigation
**Goal**: User can browse conversation history with search, date grouping, and visual indicators
**Depends on**: Phase 4
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04, SIDE-05, SIDE-06
**Success Criteria** (what must be TRUE):
  1. Sidebar shows conversation history sorted by lastActivityAt (most recent first)
  2. Pinned threads appear at top of sidebar regardless of activity
  3. Threads are grouped by date (Today / Yesterday / This Week / Older)
  4. User can search threads by title and content
  5. Scroll position is preserved when switching between threads
  6. Sidekiq chats show visual indicator (icon, badge, subtitle with Sidekiq name)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Sidekiq CRUD
**Goal**: User can create, edit, and delete custom AI assistants (Sidekiqs)
**Depends on**: Phase 5
**Requirements**: KIQQ-01, KIQQ-02, KIQQ-03, KIQQ-06, KIQQ-07, KIQQ-08, KIQQ-09, KIQQ-10
**Success Criteria** (what must be TRUE):
  1. User can create a Sidekiq with name, description, and instructions (system prompt)
  2. User can edit their Sidekiq's name, description, and instructions
  3. User can delete their Sidekiq
  4. Sidekiqs show text initial avatars (colored circles with initials)
  5. User is limited to 100 Sidekiqs per account
  6. User is limited to 10 Sidekiq creations per hour (anti-spam rate limiting)
  7. Instructions are validated (max 4000 characters)
  8. Empty state shows "Create your first Sidekiq" with CTA
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Sidekiq Chat Integration
**Goal**: User can start a chat with a Sidekiq and see its personality in responses
**Depends on**: Phase 6
**Requirements**: KIQQ-04, KIQQ-05
**Success Criteria** (what must be TRUE):
  1. User can start a chat with a Sidekiq from the Sidekiq list
  2. Sidekiq's instructions are prepended as system message (not stored in message history)
  3. UI clearly indicates which Sidekiq is currently active in a conversation
  4. Messages from Sidekiq-based conversations reflect the custom instructions
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

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

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. AI Streaming Infrastructure | 2/2 | ✓ Complete | 2026-01-22 |
| 2. Basic Chat Interface | 3/3 | ✓ Complete | 2026-01-23 |
| 3. Thread Management | 4/4 | ✓ Complete | 2026-01-23 |
| 4. Model Selection & Persistence | 0/1 | Not started | - |
| 5. Sidebar & Navigation | 0/1 | Not started | - |
| 6. Sidekiq CRUD | 0/1 | Not started | - |
| 7. Sidekiq Chat Integration | 0/1 | Not started | - |
| 8. Team Foundation | 0/1 | Not started | - |
| 9. Team Sidekiq Sharing | 0/1 | Not started | - |
| 10. Error Handling & Edge Cases | 0/1 | Not started | - |
| 11. UI Polish & Animations | 0/1 | Not started | - |
| 12. Performance & Production | 0/1 | Not started | - |
