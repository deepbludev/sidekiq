# Sidekiq

## What This Is

Sidekiq is a premium AI chat application that provides model-agnostic access to multiple LLM providers (OpenAI, Anthropic, etc.) through a single interface, similar to t3.chat. The core differentiator is "Sidekiqs" — custom AI assistants with specific instructions, names, and descriptions (like OpenAI's GPTs or Google's Gems) that can be shared within teams.

Target users are small teams and startups who want shared AI workflows, plus individual power users seeking flexibility across providers.

## Core Value

**Users can chat with any LLM through custom assistants (Sidekiqs) that can be shared with their team.**

If everything else fails, this must work: selecting a model, creating a Sidekiq with custom instructions, and having a conversation that persists.

## Requirements

### Validated

<!-- Shipped and confirmed working. -->

- ✓ Email/password authentication with validation — existing
- ✓ GitHub OAuth login — existing
- ✓ Password reset flow with email tokens (1-hour expiration) — existing
- ✓ Protected routes and middleware for authenticated pages — existing
- ✓ tRPC setup with type-safe routes and Zod validation — existing
- ✓ Database schema for Users, Teams, TeamMembers, TeamInvites, Sidekiqs, Threads, Messages — existing
- ✓ PostgreSQL with Drizzle ORM and migrations — existing
- ✓ UI component library (Radix + Tailwind + shadcn patterns) — existing
- ✓ Theme support (dark/light/system) — existing

### Active

<!-- Current scope. Building toward these. -->

**Core Chat:**
- [ ] Basic chat UI with sidebar (history) and main chat area
- [ ] Integration with LLM providers via Vercel AI Gateway (unified API key)
- [ ] Server-Sent Events (SSE) for streaming AI responses
- [ ] Message persistence with model, tokens, and metadata tracking
- [ ] Thread management: create, auto-title generation after first exchange
- [ ] Model picker (dropdown near input) with persistent selection per thread
- [ ] Thread actions: delete (permanent), archive (soft delete), pin (sticky top)
- [ ] Optimistic UI for message sending with error rollback
- [ ] Empty states with CTAs for new users
- [ ] Loading states (skeletons, streaming indicators)
- [ ] Scroll position preservation when switching threads
- [ ] Sidebar search functionality (search threads by title/content)
- [ ] Date grouping in sidebar (Today/Yesterday/This Week/Older)

**Sidekiqs (Custom Assistants):**
- [ ] CRUD pages for Sidekiqs with validation (max 4000 char instructions)
- [ ] Text initial avatars for Sidekiqs (colored circles with initials)
- [ ] Chat with a Sidekiq (instructions prepended as system message)
- [ ] Sidekiq visual indicators in sidebar (icon, badge, subtitle with name)
- [ ] Rate limiting: max 100 Sidekiqs per user, 10 creations per hour

**Teams:**
- [ ] Team creation and management pages
- [ ] Token-based team member invites (email with secure link, 7-day expiration)
- [ ] Team member management (view members, roles, remove members)
- [ ] Sidekiq team sharing logic (canTeamEdit flag for permissions)
- [ ] Team deletion flow (transfers team Sidekiqs to owner)

**UI/UX Polish:**
- [ ] Glassmorphism aesthetic (translucent backdrops, blurs, subtle gradients)
- [ ] Micro-animations for message appearance (fade-in/slide-up)
- [ ] Smooth transitions between pages
- [ ] Hover states on all interactive elements
- [ ] Polished loading states and skeletons

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Payments & Credits — Separate milestone after core features work
- Conversation branching (edit creates fork) — v2 feature, adds complexity
- Message regeneration — v2 feature
- Web Search tool — v2 feature
- Image Generation tool — v2 feature
- Deep Research tool — v2 feature
- Projects (organize chats) — v2 feature
- Public Sidekiqs directory — v2 feature
- Social login (Google) — GitHub OAuth sufficient for v1
- Mobile app — Web-first
- Real-time collaboration — Streaming only to initiating user
- Sidekiq folders — Nice-to-have, can defer

## Context

**Technical environment:**
- Next.js 15 with App Router and React Server Components
- TypeScript strict mode with Zod runtime validation
- tRPC 11 for end-to-end type safety
- PostgreSQL via Drizzle ORM
- Better Auth for authentication
- Vercel for deployment

**Prior work:**
- Database schema already defined for all core entities
- Auth flows fully implemented (email/password, GitHub OAuth, password reset)
- tRPC infrastructure ready (context, protected procedures, React Query client)
- UI component library established (Radix primitives, Tailwind, shadcn patterns)
- Testing infrastructure (Vitest + Playwright)

**Key technical decisions from PRD:**
- Vercel AI Gateway for unified API key management (no per-provider keys in app)
- SSE for streaming (not WebSockets)
- parentMessageId for conversation branching structure (ready for v2)
- Asynchronous credit deduction after response delivery (ready for payments milestone)

## Constraints

- **Tech stack**: Must use existing stack (Next.js, tRPC, Drizzle, Better Auth) — consistency and learning goals
- **Package manager**: pnpm only — strict requirement
- **UI quality**: Polished from start, not "functional then beautiful" — user experience is core value proposition
- **No payments in v1**: Core features must work before monetization — shipping usable product first

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vercel AI Gateway for LLM access | Single API key, unified interface, no provider-specific config | — Pending |
| SSE for streaming (not WebSockets) | Simpler, Vercel AI SDK native support, sufficient for single-user streams | — Pending |
| Branching via parentMessageId | Schema ready for v2 branching feature without migration | — Pending |
| GitHub OAuth only for v1 | Faster to ship, Google can be added later | — Pending |
| Payments as separate milestone | Ship usable product first, validate core value before monetization | — Pending |

---
*Last updated: 2026-01-22 after initialization*
