# Requirements

**Project:** Sidekiq
**Milestone:** v1 - Core Experience
**Created:** 2026-01-22

## v1 Requirements

### Core Chat (CHAT)

- [x] **CHAT-01**: User can send a message and receive a streaming AI response
- [x] **CHAT-02**: User can select which LLM model to use (GPT-4o, Claude, etc.) via dropdown near input
- [x] **CHAT-03**: Model selection persists for the entire thread (sticky per thread)
- [x] **CHAT-04**: User can create a new conversation thread
- [x] **CHAT-05**: Thread title is auto-generated after first user message + AI response exchange
- [x] **CHAT-06**: User can manually edit thread title
- [x] **CHAT-07**: User can delete a thread (permanent, with confirmation dialog)
- [x] **CHAT-08**: User can archive a thread (soft delete, recoverable)
- [x] **CHAT-09**: User can pin a thread (sticky to top of sidebar)
- [x] **CHAT-10**: Messages are persisted to database with model, tokens, and metadata
- [x] **CHAT-11**: Message sending shows optimistic UI with error rollback
- [x] **CHAT-12**: Streaming shows typing indicator followed by token-by-token rendering

### Sidebar & Organization (SIDE)

- [ ] **SIDE-01**: Sidebar shows conversation history sorted by lastActivityAt (most recent first)
- [ ] **SIDE-02**: Pinned threads appear at top of sidebar regardless of activity
- [ ] **SIDE-03**: Threads are grouped by date (Today / Yesterday / This Week / Older)
- [ ] **SIDE-04**: User can search threads by title and content
- [ ] **SIDE-05**: Scroll position is preserved when switching between threads
- [ ] **SIDE-06**: Sidekiq chats show visual indicator (icon, badge, subtitle with Sidekiq name)

### Sidekiqs - Custom Assistants (KIQQ)

- [ ] **KIQQ-01**: User can create a Sidekiq with name, description, and instructions (system prompt)
- [ ] **KIQQ-02**: User can edit their Sidekiq's name, description, and instructions
- [ ] **KIQQ-03**: User can delete their Sidekiq
- [ ] **KIQQ-04**: User can start a chat with a Sidekiq (instructions prepended as system message)
- [ ] **KIQQ-05**: UI indicates which Sidekiq is currently active in a conversation
- [ ] **KIQQ-06**: Sidekiqs show text initial avatars (colored circles with initials)
- [ ] **KIQQ-07**: User is limited to 100 Sidekiqs per account
- [ ] **KIQQ-08**: User is limited to 10 Sidekiq creations per hour (anti-spam)
- [ ] **KIQQ-09**: Instructions are validated (max 4000 characters)
- [ ] **KIQQ-10**: Empty state shows "Create your first Sidekiq" with CTA

### Team Management (TEAM)

- [ ] **TEAM-01**: User can create a team with a name
- [ ] **TEAM-02**: User can view team members and their roles
- [ ] **TEAM-03**: Team owner can invite members via email (token-based secure link)
- [ ] **TEAM-04**: Team invites expire after 7 days
- [ ] **TEAM-05**: Team owner can revoke pending invites
- [ ] **TEAM-06**: Team owner can remove members from the team
- [ ] **TEAM-07**: User can share a Sidekiq with their team (teamId assignment)
- [ ] **TEAM-08**: Team members can view and use team-shared Sidekiqs
- [ ] **TEAM-09**: Sidekiq owner controls edit permissions via canTeamEdit flag
- [ ] **TEAM-10**: When team is deleted, team Sidekiqs transfer to owner (with confirmation)
- [ ] **TEAM-11**: Invite recipient clicks link, authenticates if needed, and auto-joins team

### UI/UX Polish (UIUX)

- [x] **UIUX-01**: Dark/Light/System theme toggle works correctly
- [x] **UIUX-02**: Glassmorphism aesthetic with translucent backdrops and blur effects
- [x] **UIUX-03**: Subtle gradients throughout the interface
- [ ] **UIUX-04**: Micro-animations for message appearance (fade-in/slide-up)
- [ ] **UIUX-05**: Smooth transitions between pages
- [ ] **UIUX-06**: Hover states on all interactive elements
- [ ] **UIUX-07**: Skeleton loading states for sidebar and chat area
- [ ] **UIUX-08**: Streaming indicator with cursor animation during AI response
- [x] **UIUX-09**: Empty states for new users with CTAs ("Start your first conversation")
- [ ] **UIUX-10**: Responsive design with sidebar as drawer on mobile
- [ ] **UIUX-11**: Markdown rendering for AI responses (code blocks, tables, lists)

### Error Handling (ERRR)

- [ ] **ERRR-01**: Failed message sends show error toast and remove the failed message
- [ ] **ERRR-02**: Streaming failures are detected and show retry option
- [ ] **ERRR-03**: Network errors show user-friendly messages
- [ ] **ERRR-04**: Rate limit errors show clear feedback with wait time

## v2 Requirements (Deferred)

### Payments & Credits
- Stripe integration for subscriptions and top-ups
- Credit balance tracking (user and team level)
- Usage tracking per message (tokens, model, cost)
- Auto-top-up configuration

### Advanced Chat Features
- Conversation branching (edit creates fork with parent-child references)
- Branch navigation (< 2 / 5 > controls)
- Message regeneration (regenerate last AI response)
- Web search tool
- Image generation tool
- Deep research tool

### Additional Features
- Google OAuth login
- Projects (organize chats)
- Public Sidekiqs directory
- Sidekiq folders
- Share chat via link

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payments & Credits | Separate milestone - ship usable product first |
| Conversation branching | Adds complexity, schema ready for v2 |
| Message regeneration | Nice-to-have, not core value |
| Tools (web search, image gen) | v2 features |
| Google OAuth | GitHub OAuth sufficient for v1 |
| Real-time collaboration | Streaming only to initiating user |
| Mobile app | Web-first |

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| CHAT-01 | Phase 1 | Complete |
| CHAT-02 | Phase 4 | Pending |
| CHAT-03 | Phase 4 | Pending |
| CHAT-04 | Phase 3 | Complete |
| CHAT-05 | Phase 3 | Complete |
| CHAT-06 | Phase 3 | Complete |
| CHAT-07 | Phase 3 | Complete |
| CHAT-08 | Phase 3 | Complete |
| CHAT-09 | Phase 3 | Complete |
| CHAT-10 | Phase 1 | Complete |
| CHAT-11 | Phase 2 | Complete |
| CHAT-12 | Phase 1 | Complete |
| SIDE-01 | Phase 5 | Pending |
| SIDE-02 | Phase 5 | Pending |
| SIDE-03 | Phase 5 | Pending |
| SIDE-04 | Phase 5 | Pending |
| SIDE-05 | Phase 5 | Pending |
| SIDE-06 | Phase 5 | Pending |
| KIQQ-01 | Phase 6 | Pending |
| KIQQ-02 | Phase 6 | Pending |
| KIQQ-03 | Phase 6 | Pending |
| KIQQ-04 | Phase 7 | Pending |
| KIQQ-05 | Phase 7 | Pending |
| KIQQ-06 | Phase 6 | Pending |
| KIQQ-07 | Phase 6 | Pending |
| KIQQ-08 | Phase 6 | Pending |
| KIQQ-09 | Phase 6 | Pending |
| KIQQ-10 | Phase 6 | Pending |
| TEAM-01 | Phase 8 | Pending |
| TEAM-02 | Phase 8 | Pending |
| TEAM-03 | Phase 8 | Pending |
| TEAM-04 | Phase 8 | Pending |
| TEAM-05 | Phase 8 | Pending |
| TEAM-06 | Phase 8 | Pending |
| TEAM-07 | Phase 9 | Pending |
| TEAM-08 | Phase 9 | Pending |
| TEAM-09 | Phase 9 | Pending |
| TEAM-10 | Phase 9 | Pending |
| TEAM-11 | Phase 8 | Pending |
| UIUX-01 | Phase 2 | Complete |
| UIUX-02 | Phase 2 | Complete |
| UIUX-03 | Phase 2 | Complete |
| UIUX-04 | Phase 11 | Pending |
| UIUX-05 | Phase 11 | Pending |
| UIUX-06 | Phase 11 | Pending |
| UIUX-07 | Phase 12 | Pending |
| UIUX-08 | Phase 12 | Pending |
| UIUX-09 | Phase 2 | Complete |
| UIUX-10 | Phase 12 | Pending |
| UIUX-11 | Phase 12 | Pending |
| ERRR-01 | Phase 10 | Pending |
| ERRR-02 | Phase 10 | Pending |
| ERRR-03 | Phase 10 | Pending |
| ERRR-04 | Phase 10 | Pending |

---
*Requirements defined: 2026-01-22*
*Total v1 requirements: 54*
*Requirements mapped: 54/54 (100% coverage)*
