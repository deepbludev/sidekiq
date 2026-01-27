# Sidekiq

## What This Is

Sidekiq is a premium AI chat application that provides model-agnostic access to multiple LLM providers (OpenAI, Anthropic, Google, etc.) through a single interface, similar to t3.chat. The core differentiator is "Sidekiqs" — custom AI assistants with specific instructions, names, and descriptions (like OpenAI's GPTs or Google's Gems) that can be shared within teams. Features a Linear-inspired design system with two-tier sidebar navigation, keyboard shortcuts, and a polished dark-mode-first aesthetic.

Target users are small teams and startups who want shared AI workflows, plus individual power users seeking flexibility across providers.

## Core Value

**Users can chat with any LLM through custom assistants (Sidekiqs) that can be shared with their team.**

If everything else fails, this must work: selecting a model, creating a Sidekiq with custom instructions, and having a conversation that persists.

## Requirements

### Validated

- ✓ Email/password authentication with validation — existing
- ✓ GitHub OAuth login — existing
- ✓ Password reset flow with email tokens (1-hour expiration) — existing
- ✓ Protected routes and middleware for authenticated pages — existing
- ✓ tRPC setup with type-safe routes and Zod validation — existing
- ✓ Database schema for Users, Teams, TeamMembers, TeamInvites, Sidekiqs, Threads, Messages — existing
- ✓ PostgreSQL with Drizzle ORM and migrations — existing
- ✓ UI component library (Radix + Tailwind + shadcn patterns) — existing
- ✓ Theme support (dark/light/system) — existing
- ✓ Send message and receive streaming AI response — v0.1
- ✓ Select LLM model via dropdown near input — v0.1
- ✓ Model selection persists per thread — v0.1
- ✓ Create new conversation thread — v0.1
- ✓ Auto-generated thread title after first exchange — v0.1
- ✓ Manually edit thread title — v0.1
- ✓ Delete thread with confirmation — v0.1
- ✓ Archive thread (soft delete) — v0.1
- ✓ Pin thread to top — v0.1
- ✓ Messages persisted with model, tokens, and metadata — v0.1
- ✓ Optimistic UI with error rollback — v0.1
- ✓ Streaming with typing indicator — v0.1
- ✓ Sidebar sorted by lastActivityAt — v0.1
- ✓ Pinned threads at top — v0.1
- ✓ Date grouping (Today/Yesterday/This Week/Older) — v0.1
- ✓ Search threads by title — v0.1
- ✓ Scroll position preserved — v0.1
- ✓ Sidekiq visual indicators in sidebar — v0.1
- ✓ Create Sidekiq with name/desc/instructions — v0.1
- ✓ Edit Sidekiq — v0.1
- ✓ Delete Sidekiq — v0.1
- ✓ Chat with Sidekiq (system message injection) — v0.1
- ✓ UI indicates active Sidekiq — v0.1
- ✓ Text initial avatars for Sidekiqs — v0.1
- ✓ Rate limiting: 25 Sidekiq creations per hour — v0.1
- ✓ Instructions validated (8000 chars max) — v0.1
- ✓ Empty state with CTA — v0.1
- ✓ Create team with name — v0.1
- ✓ View team members and roles — v0.1
- ✓ Invite members via email (token-based) — v0.1
- ✓ Invites expire after 7 days — v0.1
- ✓ Revoke pending invites — v0.1
- ✓ Remove team members — v0.1
- ✓ Invite acceptance flow — v0.1
- ✓ Dark/Light/System theme toggle — v0.1
- ✓ Linear-inspired aesthetic with oklch palette — v0.1
- ✓ Empty states with CTAs — v0.1
- ✓ Two-tier sidebar with icon rail and contextual panels — v0.1

### Active

- [ ] Share Sidekiq with team (teamId assignment)
- [ ] Team members view and use shared Sidekiqs
- [ ] Sidekiq owner controls edit permissions (canTeamEdit flag)
- [ ] Team deletion transfers Sidekiqs to owner
- [ ] Failed message sends show error toast and remove failed message
- [ ] Streaming failures detected with retry option
- [ ] Network errors show user-friendly messages
- [ ] Rate limit errors show clear feedback with wait time
- [ ] Micro-animations for message appearance
- [ ] Smooth transitions between pages
- [ ] Hover states on all interactive elements
- [ ] Skeleton loading states for sidebar and chat area
- [ ] Streaming indicator with cursor animation
- [ ] 100 Sidekiqs per user limit (subscription-gated)

### Out of Scope

- Payments & Credits — Separate milestone after core features work
- Conversation branching (edit creates fork) — v2 feature, adds complexity
- Message regeneration — v2 feature
- Web Search tool — v2 feature
- Image Generation tool — v2 feature
- Deep Research tool — v2 feature
- Projects (organize chats) — v2 feature
- Public Sidekiqs directory — v2 feature
- Social login (Google) — GitHub OAuth sufficient for now
- Mobile app — Web-first
- Real-time collaboration — Streaming only to initiating user
- Sidekiq folders — Nice-to-have, can defer

## Context

**Shipped v0.1 with 18,701 lines of TypeScript across 170 files.**

Tech stack: Next.js 15 (App Router), tRPC 11, Drizzle ORM, PostgreSQL, Better Auth, Vercel AI SDK, Tailwind CSS v4, Radix UI.

Design: Linear-inspired with oklch blue-indigo (hue 260) palette, Inter font, 6px base border radius, dark-mode-first. Two-tier sidebar with 48px icon rail and 288px contextual panels.

Architecture: Horizontal layers — api (tRPC routers), components (UI), hooks, lib (utilities). Future consideration: vertical feature slicing.

Testing: Vitest unit tests, Playwright E2E tests.

Known tech debt:
- Edit/regenerate message actions show "coming soon" placeholders
- 2 unused ESLint imports
- 3 stale phase directories in .planning/phases/

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vercel AI Gateway for LLM access | Single API key, unified interface, no provider-specific config | ✓ Good |
| SSE for streaming (not WebSockets) | Simpler, Vercel AI SDK native support, sufficient for single-user streams | ✓ Good |
| Branching via parentMessageId | Schema ready for v2 branching feature without migration | — Pending |
| GitHub OAuth only for v1 | Faster to ship, Google can be added later | ✓ Good |
| Payments as separate milestone | Ship usable product first, validate core value before monetization | ✓ Good |
| Runtime system message injection for Sidekiqs | Instructions prepended at chat time, not stored in DB messages | ✓ Good |
| Model selection priority: thread > sidekiq > user > default | Clear precedence chain for model resolution | ✓ Good |
| oklch hue 260 (blue-indigo) palette | Linear-inspired, consistent across dark/light themes | ✓ Good |
| Two-tier sidebar (icon rail + panel) | Scales to future features, clear navigation hierarchy | ✓ Good |
| Route-based panel switching via usePathname() | No React state for panel selection, URL-driven | ✓ Good |
| React key prop for ChatInterface remount on Sidekiq switch | Clean state reset without manual cleanup | ✓ Good |
| deletedSidekiqName column for graceful degradation | Preserves context when Sidekiq is deleted | ✓ Good |
| DEFER Convex migration | PostgreSQL/Drizzle has no pain points, reconsider later | ✓ Good |
| Manual psql for ALTER TYPE ADD VALUE | Drizzle transaction constraints prevent enum modifications | ⚠️ Revisit |

## Constraints

- **Tech stack**: Must use existing stack (Next.js, tRPC, Drizzle, Better Auth) — consistency and learning goals
- **Package manager**: pnpm only — strict requirement
- **UI quality**: Polished from start, not "functional then beautiful" — user experience is core value proposition
- **No payments in v1**: Core features must work before monetization — shipping usable product first

---
*Last updated: 2026-01-26 after v0.1 milestone*
