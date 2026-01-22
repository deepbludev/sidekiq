# Project Research Summary

**Project:** Sidekiq - Premium AI Chat Application
**Domain:** Multi-provider AI chat with custom assistants and team collaboration
**Researched:** 2026-01-22
**Confidence:** HIGH

## Executive Summary

Sidekiq is a premium AI chat application that combines model-agnostic LLM access (similar to T3.chat) with custom assistants called "Sidekiqs" (similar to ChatGPT's GPTs or Google's Gems) and team collaboration features. Research reveals that in 2026, the technology stack for such applications has converged around Vercel AI SDK 6.x for streaming, Server-Sent Events for transport, and a critical architectural split: streaming endpoints in Next.js Route Handlers and CRUD operations in tRPC. The existing foundation (Next.js 15, tRPC 11, PostgreSQL, Drizzle ORM, Better Auth) is already well-aligned with industry best practices.

The competitive landscape shows that table stakes features are well-established (streaming responses, markdown rendering, conversation management, multi-provider support), while differentiation comes from execution quality, team collaboration, and model-switching flexibility. The product positioning as a cost-effective alternative ($8/month like T3.chat vs $20+ incumbents) with both multi-provider access AND custom assistants AND team features represents a unique value proposition.

Critical risks center on three areas: (1) streaming reliability with disconnection recovery, (2) token counting inconsistencies across providers leading to cost explosions, and (3) prompt injection vulnerabilities that are fundamentally unsolvable and require containment rather than prevention. The architectural decision to keep tRPC for CRUD operations while using Route Handlers for AI streaming is not a compromise—it's the industry standard pattern in 2026.

## Key Findings

### Recommended Stack

The 2025-2026 stack for AI chat applications centers on **Vercel AI SDK 6.x** as the industry standard (20+ million monthly downloads) with unified provider APIs, native React hooks, and production-ready state management. Research confirms the existing stack requires minimal additions: just `ai`, `@ai-sdk/openai`, and `@ai-sdk/anthropic` packages.

**Core technologies:**
- **Vercel AI SDK 6.x** (`ai@6.0.48+`) — Unified streaming API, React hooks, message persistence patterns. Industry standard with native Next.js 15 integration
- **Server-Sent Events (SSE)** — Streaming transport, not WebSockets. Purpose-built for server-to-client streaming, simpler infrastructure, Vercel AI SDK native support
- **Next.js Route Handlers** — For AI streaming endpoints (not tRPC). Required because Vercel AI SDK's `useChat` hook expects standard fetch-compatible endpoints
- **Vercel AI Gateway** (MVP) → **Portkey AI Gateway** (production) — Multi-provider routing. Start with Vercel's built-in gateway, migrate to Portkey when needing observability, guardrails, and compliance features
- **PostgreSQL with prefix-based message schema** — Not JSONB for tool calls. Avoids data integrity issues, better type safety, easier indexing
- **Redis (Phase 2+)** — Defer until 50-100+ concurrent users. Use for session caching, rate limiting, semantic caching for cost reduction

**Critical constraint discovered:** tRPC cannot be used with Vercel AI SDK's streaming hooks due to fundamental incompatibility. Community consensus (GitHub issues #3236, #6103) confirms this is expected behavior. The hybrid approach (Route Handlers for streaming, tRPC for CRUD) is standard practice.

**Installation needed:** `pnpm add ai @ai-sdk/openai @ai-sdk/anthropic`

### Expected Features

Research of ChatGPT, Claude, T3.chat, and Gemini (2025-2026 capabilities) reveals clear feature tiers.

**Must have (table stakes):**
- Streaming responses with markdown rendering — Non-streaming feels broken in 2026
- Code blocks with copy button and syntax highlighting — Developers are primary users
- Conversation history with search — Both ChatGPT and Claude added full-text search in 2025
- Model selection dropdown — Users expect control over which LLM they use
- Message editing and regeneration — Dead-end conversations without this feel rigid
- Authentication with OAuth — Social login is expected (Google, GitHub)
- Dark mode — Universally expected, system preference detection required

**Should have (competitive advantages):**
- Multi-provider model switching — T3.chat's killer feature, 2x faster than ChatGPT
- Custom assistants (Sidekiqs) with system prompts — Core differentiator vs T3.chat (which lacks this)
- Team sharing of assistants — Enterprise/team positioning requires this
- Shared conversation history within teams — ChatGPT and Claude both have "Projects" for this
- Role-based permissions — "Can use" vs "Can edit" (Claude's pattern is clear and simple)

**Defer to v2+ (avoid premature complexity):**
- Knowledge base upload for assistants — Complex RAG pipeline (embeddings, vector search, chunking)
- Tool/action configuration — Very high complexity, function calling, OAuth integrations
- Assistant marketplace — Requires scale first, discovery layer, moderation
- Group chats — ChatGPT just launched Nov 2025, requires complex real-time sync
- Document upload (PDF, DOCX) — High complexity OCR, RAG pipeline
- Voice input/output — High complexity, <200ms latency requirements
- Web search integration — Complex API integration, citation management
- Image generation — Only ChatGPT has this, high cost, niche for chat product

**Anti-features (deliberately avoid):**
- Chat-only interface for structured tasks — Research shows 18 of 20 users prefer GUI for transactions
- Infinite message limits — Leads to abuse, unsustainable costs (ChatGPT: 80/3hrs, Claude: 216/day limits)
- Auto-title every conversation — Wastes tokens, often generates bad titles
- Custom fine-tuned models (MVP) — Use system prompts and few-shot examples first
- Agent orchestration initially — Complex, brittle, only 5% of pilots reach production
- Native mobile apps (MVP) — Progressive Web App first, native later if traction

### Architecture Approach

Modern AI chat systems follow a split-responsibility architecture where streaming happens in Route Handlers, client state is managed via Vercel AI SDK hooks, and database persistence occurs server-side after streaming completes. The Vercel AI SDK provides the de facto standard for React-based interfaces.

**Major components:**
1. **Chat UI (Client)** — Uses `useChat` hook from Vercel AI SDK, manages streaming state and optimistic updates, renders messages with markdown
2. **Route Handler (/api/chat)** — Orchestrates AI streaming via `streamText()`, handles tool execution, persists messages after stream completion using `consumeStream()`, injects Sidekiq system prompts
3. **tRPC Router** — Handles all non-streaming CRUD: threads (list, create, delete, archive, pin), messages (load history), Sidekiqs (create, update, share), teams (all operations)
4. **Database (PostgreSQL + Drizzle)** — Persistent storage with adjacency list pattern for message tree (already supports branching via `parentMessageId` for v2), denormalized thread metadata for performance
5. **LLM Provider (via Vercel AI Gateway)** — Multi-provider access (OpenAI, Anthropic, etc.) with unified interface, start with Vercel's built-in gateway, migrate to Portkey for production observability

**Key patterns to follow:**
- **Server-side ID generation** — Message IDs created on server, not client, for consistency
- **Background stream consumption** — Use `consumeStream()` to ensure persistence even if client disconnects
- **Optimistic updates with rollback** — Show messages instantly, roll back on error (React 19's `useOptimistic` automates this)
- **Prefetch on server, hydrate on client** — Load messages via tRPC in Server Component, pass to `useChat` as `initialMessages`
- **Sidekiq instruction injection** — Prepend system message at request time, never store in message history

**Data flow (message sending):**
1. User sends message → `useChat` adds optimistically
2. POST /api/chat with message payload
3. Route Handler loads Sidekiq instructions (if applicable), calls `streamText()`
4. Stream chunks forwarded to client via ReadableStream
5. `consumeStream()` persists both user + assistant messages after completion
6. Update thread metadata (lastActivityAt, messageCount)
7. Client receives completion, tRPC cache invalidates for sidebar update

**Database schema notes:**
- Adjacency list pattern (`parentMessageId`) already supports conversation branching for v2
- Linear conversation for v1: always set `parentMessageId` (message N's parent is N-1)
- Denormalized thread fields (`messageCount`, `lastActivityAt`, `isPinned`) for sidebar performance
- Prefix-based message schema for tool calls (not JSONB) for type safety

### Critical Pitfalls

Research from production systems (2025-2026) reveals specific failure modes unique to AI chat applications.

1. **Streaming disconnection without recovery** — Connections drop mid-stream, users lose 20-80% of responses without knowing it. Prevention: Implement `onAbort` callback in `useChat`, use `consumeStream()` on server, show connection health indicators. Phase 1 must-have.

2. **Token counting inconsistency across providers** — Using OpenAI's tiktoken for all providers causes 20-40% billing discrepancies. Claude, Gemini tokenize differently. Hidden reasoning tokens (GPT-o1) not counted. Prevention: Provider-specific tokenizers (`@anthropic-ai/tokenizer`, `@google/generative-ai/tokenizer`), track actual vs estimated. Phase 2 critical when adding multi-provider.

3. **Prompt injection is unfixable (design for containment)** — UK NCSC and OpenAI acknowledge prompt injection may never be fully mitigated. 20% of jailbreaks succeed in 42 seconds. Prevention is impossible—design for containment: assume breach architecture, output filtering over input detection, human-in-the-loop for privileged operations, limit AI privileges. Phase 2+ for custom assistants.

4. **Optimistic UI without robust rollback** — Messages shown instantly but backend failures leave ghost messages in UI. User refreshes, their last 3 messages vanish. Prevention: Mandatory rollback logic (React 19's `useOptimistic` automates), persist messages with status ("streaming", "complete", "failed"), idempotency keys prevent duplicates. Phase 1 must-have.

5. **Cost explosion without real-time monitoring** — AI spend jumps 5-10x overnight, discovered 28 days later on invoice. No attribution to user/model/feature. Prevention: Real-time cost tracking per request, predictive alerting (daily spend >3x moving average), multi-dimensional rate limiting (tokens/minute, cost/hour, cost/day), gateway layer for unified tracking. Phase 2-3 critical for production.

**Additional moderate pitfalls:**
- **Using WebSockets for unidirectional streaming** — Memory scales linearly with users (70 KiB per connection), SSE is simpler and cheaper
- **Naive context window management** — Sending entire conversation history on every request, costs balloon, latency degrades
- **Inconsistent multi-provider prompt compatibility** — Prompts optimized for GPT-4 perform poorly on Claude/Gemini
- **Missing abort/cancellation handling** — "Stop generating" doesn't actually stop processing, orphaned requests pile up
- **Multi-tenant data isolation failures** — Team A's assistants appear in Team B's list, SQL injection bypasses app-layer auth

## Implications for Roadmap

Based on research findings, the recommended phase structure follows dependency chains and risk mitigation patterns identified in architecture and pitfall analysis.

### Phase 1: Core Chat Foundation (Weeks 1-3)
**Rationale:** Can't build custom assistants without working chat. Streaming reliability must be solved before adding complexity. This phase establishes the foundational split between Route Handlers (streaming) and tRPC (CRUD) that all subsequent features depend on.

**Delivers:**
- Working AI chat with streaming responses and markdown rendering
- Conversation history (list, create, rename, delete)
- Model selection (OpenAI and Anthropic providers)
- Message editing and regeneration
- Authentication via Better Auth (already exists)
- Basic settings panel (theme, usage display)

**Addresses features:**
- All "table stakes" from FEATURES.md (streaming, markdown, history, model selection)
- Optimistic UI with rollback (PITFALLS.md #4)
- Streaming disconnection recovery (PITFALLS.md #1)

**Avoids pitfalls:**
- Phase 1 must implement `onAbort` handling from day one
- Optimistic updates with rollback mandatory
- Server-side message persistence using `consumeStream()`

**Tech stack elements:**
- Vercel AI SDK 6.x (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
- Next.js Route Handler for /api/chat
- Server-Sent Events for streaming
- PostgreSQL + Drizzle for message persistence
- tRPC for thread CRUD operations

**Research flag:** Standard patterns, skip `/gsd:research-phase` (well-documented in Vercel AI SDK docs)

### Phase 2: Custom Assistants - Sidekiqs (Weeks 4-6)
**Rationale:** Core differentiator vs T3.chat, but requires working chat foundation first. Start simple (system prompts only) to deliver 80% of value with 20% of complexity. Knowledge base upload (RAG) deferred to v2 due to high complexity.

**Delivers:**
- Create custom Sidekiq with name, description, system prompt
- Model selection per Sidekiq (optimal model for each use case)
- Personal Sidekiq library (list, search, edit, delete)
- Chat with Sidekiq (system prompt injection)
- Share Sidekiq via public URL

**Addresses features:**
- Custom assistants from FEATURES.md (core differentiator)
- Defers knowledge base upload and tool configuration (v2 features)

**Implements architecture:**
- Sidekiq instruction injection pattern (prepend system message at request time)
- Thread ↔ Sidekiq association in database
- Validation of Sidekiq access before injecting instructions

**Avoids pitfalls:**
- Prompt injection containment (PITFALLS.md #3) — Output filtering, limit AI privileges
- Don't store instructions in message history (causes issues when Sidekiq edited)
- Provider-specific prompt templates for multi-provider compatibility

**Tech stack elements:**
- tRPC router for Sidekiq CRUD
- PostgreSQL sidekiqs table (already exists in schema)
- Route Handler modification for system prompt injection

**Research flag:** May need `/gsd:research-phase` for prompt injection mitigation strategies and output filtering patterns

### Phase 3: Team Collaboration (Weeks 7-9)
**Rationale:** Enterprise positioning requires team features. Shared assistants provide viral growth mechanism. Must come after Sidekiqs exist. Start simple (shared library) before complex features (group chats).

**Delivers:**
- Team creation and member management
- Shared Sidekiq library (team members can access)
- Shared conversation history (team can view)
- Role-based permissions ("Can use" vs "Can edit")
- Team-scoped billing and usage tracking

**Addresses features:**
- Team sharing from FEATURES.md (competitive advantage)
- Defers group chats and shared projects with files (v2)

**Implements architecture:**
- Multi-tenant data isolation with tenant ID in every query
- Row-level security in PostgreSQL (optional but recommended)
- Team-scoped cost attribution

**Avoids pitfalls:**
- Multi-tenant data isolation failures (PITFALLS.md #10) — Tenant ID mandatory in all queries
- Cost explosion without attribution (PITFALLS.md #5) — Per-team cost tracking
- Prompt injection in shared context — Team boundaries must be enforced

**Tech stack elements:**
- tRPC router for team operations
- PostgreSQL teams table with member associations
- Middleware for team context injection

**Research flag:** Standard multi-tenant patterns, but may need `/gsd:research-phase` for team-specific rate limiting and cost allocation strategies

### Phase 4: Multi-Provider Enhancement (Weeks 10-12)
**Rationale:** Competitive differentiation (T3.chat positioning), but requires stable foundation. Token counting and cost tracking become critical with multiple providers.

**Delivers:**
- Expanded provider support (Google Gemini, additional OpenAI models)
- Provider-specific token counting
- Actual vs estimated token tracking
- Multi-dimensional rate limiting (requests, tokens, cost)
- Real-time cost monitoring dashboard

**Addresses features:**
- Multi-provider model switching from FEATURES.md (killer feature)
- Cost transparency (usage tracking, limits display)

**Avoids pitfalls:**
- Token counting inconsistency (PITFALLS.md #2) — Provider-specific tokenizers mandatory
- Cost explosion (PITFALLS.md #5) — Real-time tracking, predictive alerts
- Context window management (PITFALLS.md #7) — Conversation summarization

**Tech stack elements:**
- Additional AI SDK providers (`@ai-sdk/google`)
- Provider-specific tokenizers
- Redis for rate limiting (optional, can use PostgreSQL initially)
- Portkey AI Gateway migration (when needing observability)

**Research flag:** Definitely needs `/gsd:research-phase` for provider-specific tokenization and cost modeling

### Phase 5: Production Hardening (Weeks 13-15)
**Rationale:** UX polish and reliability features that require all core functionality to exist first.

**Delivers:**
- Conversation search (full-text across titles and content)
- Thread organization (pin, archive, folders/tags)
- Auto-title generation for conversations
- Loading state improvements (progressive indicators, connection status)
- Error recovery (retry logic, exponential backoff)
- Comprehensive monitoring and alerting

**Addresses features:**
- Search chat history from FEATURES.md (table stakes added in 2025)
- Pin/favorite, folder organization (reduces "find time" by 30%)
- Advanced UX patterns (keyboard shortcuts, mobile optimization)

**Avoids pitfalls:**
- Poor loading state communication (PITFALLS.md #11)
- Partial response handling (PITFALLS.md #12)
- Inefficient message persistence timing (PITFALLS.md #13)

**Research flag:** Standard patterns, skip `/gsd:research-phase`

### Phase Ordering Rationale

**Dependency chain:**
- Phase 1 → Phase 2: Can't have custom assistants without working chat
- Phase 2 → Phase 3: Can't share assistants that don't exist yet
- Phase 3 → Phase 4: Multi-provider cost tracking needs team attribution
- Phase 4 → Phase 5: Production hardening requires all features to exist

**Risk mitigation sequence:**
- Phase 1 addresses streaming reliability (critical, can't be deferred)
- Phase 2 introduces prompt injection risk (containment patterns required)
- Phase 3 introduces multi-tenant isolation risk (tenant ID from day one)
- Phase 4 addresses cost explosion risk (real-time monitoring)

**Architecture pattern alignment:**
- Early phases establish Route Handler + tRPC split (Phase 1)
- Middle phases build on CRUD patterns (Phase 2-3)
- Later phases add observability layer (Phase 4-5)

**Avoid premature complexity:**
- No RAG pipeline until v2 (knowledge base upload deferred)
- No tool calling until v2 (function calling complexity deferred)
- No group chats until v2 (real-time sync complexity deferred)
- Redis deferred until Phase 4+ (PostgreSQL sufficient for MVP)

### Research Flags

**Phases needing `/gsd:research-phase` during planning:**
- **Phase 2 (Custom Assistants):** Prompt injection mitigation, output filtering patterns, provider-specific prompt templates
- **Phase 3 (Teams):** Team-specific rate limiting strategies, cost allocation patterns for multi-tenant
- **Phase 4 (Multi-Provider):** Provider-specific tokenization libraries, cost modeling across providers, semantic caching patterns

**Phases with standard patterns (skip research):**
- **Phase 1 (Core Chat):** Vercel AI SDK is extensively documented with examples
- **Phase 5 (Production Hardening):** Standard UX patterns, well-documented

**When to trigger research during implementation:**
- Encountering provider-specific API quirks not documented
- Implementing advanced cost tracking (time-series database options)
- Migrating to Portkey AI Gateway (integration patterns)
- Adding Redis caching layer (semantic caching strategies)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vercel AI SDK is industry standard, 20M+ downloads/month, official docs verified, community consensus on Route Handler + tRPC split |
| Features | HIGH | Competitive analysis based on current ChatGPT, Claude, T3.chat, Gemini capabilities (2025-2026), table stakes well-established |
| Architecture | HIGH | Split-responsibility pattern verified across multiple 2026 sources, Vercel Labs examples, production systems |
| Pitfalls | HIGH | Based on 40+ production post-mortems, OWASP guidelines, official security advisories from OpenAI/UK NCSC |

**Overall confidence:** HIGH

All recommendations verified with official documentation (Vercel AI SDK, Next.js 15, provider docs) and 2025-2026 sources. Stack decisions are based on current ecosystem state, not speculation.

### Gaps to Address

**Technology:**
- **Redis caching patterns** — Research shows semantic caching can reduce costs 90%, but implementation patterns need deeper research when implementing Phase 4+
- **Portkey AI Gateway migration** — Migration path from Vercel AI Gateway to Portkey needs hands-on testing, not just documentation review
- **Provider-specific tokenizers** — Each provider (Anthropic, Google) has different tokenization libraries with different APIs, need integration testing

**Features:**
- **Custom assistant discovery** — Research focused on creation/sharing, not marketplace/discovery patterns. If building assistant marketplace in v2, needs separate research
- **Group chats** — ChatGPT just launched Nov 2025, limited production experience data. If adding in v2, needs real-time sync architecture research
- **Voice I/O** — Research mentions <200ms latency requirements, but implementation patterns for WebRTC + AI SDK integration need separate research

**Security:**
- **Output filtering specifics** — Research confirms output filtering > input detection, but specific filtering rules for Sidekiq responses need testing
- **Tool calling security** — If adding function calling in v2, needs separate security research for API permission boundaries
- **Team-level RBAC** — Basic "Can use" vs "Can edit" is clear, but granular permissions (admin, member, viewer) need policy modeling

**Business/Operations:**
- **Stripe payment integration** — Out of scope for this research, needs separate payment flow research
- **Cost modeling for pricing tiers** — Research provides token costs, but mapping to user tiers ($8/month positioning) needs financial modeling
- **SLA/reliability targets** — No research on uptime targets, error budgets, or incident response patterns

**How to handle during planning:**
- For technology gaps: Trigger `/gsd:research-phase` when reaching that phase
- For security gaps: Include security review sprint before production launch
- For business gaps: Separate business/pricing research outside technical planning

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Vercel AI SDK Introduction](https://ai-sdk.dev/docs/introduction)
- [AI SDK GitHub Releases](https://github.com/vercel/ai/releases)
- [Vercel AI SDK Persistence DB](https://github.com/vercel-labs/ai-sdk-persistence-db)
- [Next.js App Router Guide](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [Portkey AI Gateway Documentation](https://portkey.ai/features/ai-gateway)
- [Portkey Vercel AI SDK Provider](https://ai-sdk.dev/providers/community-providers/portkey)

**Platform Capabilities:**
- [Zapier: Claude vs. ChatGPT (2025)](https://zapier.com/blog/claude-vs-chatgpt/)
- [OpenAI: Introducing GPTs](https://openai.com/index/introducing-gpts/)
- [OpenAI: Group Chats in ChatGPT](https://openai.com/index/group-chats-in-chatgpt/)
- [Anthropic: Collaborate with Claude on Projects](https://www.anthropic.com/news/projects)

**Security Research:**
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [LLM Security Risks in 2026](https://sombrainc.com/blog/llm-security-risks-2026)
- [The 11 runtime attacks breaking AI security](https://venturebeat.com/security/ciso-inference-security-platforms-11-runtime-attacks-2026)

### Secondary (MEDIUM confidence)

**Technical Implementation:**
- [Streaming in Next.js 15: WebSockets vs Server-Sent Events | HackerNoon](https://hackernoon.com/streaming-in-nextjs-15-websockets-vs-server-sent-events)
- [Go with SSE for Your AI Chat App • sniki.dev](https://www.sniki.dev/posts/sse-vs-websockets-for-ai-chat/)
- [Next.js Backend for Conversational AI in 2026](https://www.sashido.io/en/blog/nextjs-backend-conversational-ai-2026)

**Cost & Token Management:**
- [AI Cost Crisis: AI Cost Sprawl Is Crashing Your Innovation](https://www.cloudzero.com/blog/ai-cost-crisis/)
- [Tracking LLM token usage across providers](https://portkey.ai/blog/tracking-llm-token-usage-across-providers-teams-and-workloads/)
- [Understanding LLM Billing: From Characters to Tokens](https://www.edenai.co/post/understanding-llm-billing-from-characters-to-tokens)

**Pitfall Research:**
- [AnyCable, Rails, and the pitfalls of LLM-streaming](https://evilmartians.com/chronicles/anycable-rails-and-the-pitfalls-of-llm-streaming)
- [Serverless strategies for streaming LLM responses](https://aws.amazon.com/blogs/compute/serverless-strategies-for-streaming-llm-responses/)
- [React 19 useOptimistic Deep Dive](https://dev.to/a1guy/react-19-useoptimistic-deep-dive-building-instant-resilient-and-user-friendly-uis-49fp)

**Multi-Tenant Patterns:**
- [Multi-tenant Architecture | AI in Production Guide](https://azure.github.io/AI-in-Production-Guide/chapters/chapter_13_building_for_everyone_multitenant_architecture)
- [Multitenancy and Azure OpenAI](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/service/openai)

### Tertiary (Community patterns, needs validation)

**Integration Challenges:**
- [Vercel AI SDK + tRPC Integration Discussion](https://github.com/vercel/ai/discussions/3236)
- [tRPC Streaming Issue](https://github.com/trpc/trpc/issues/6103)

**UX Best Practices:**
- [Parallel: UX for AI Chatbots (2025)](https://www.parallelhq.com/blog/ux-ai-chatbots)
- [IntuitionLabs: Conversational AI UI Comparison 2025](https://intuitionlabs.ai/articles/conversational-ai-ui-comparison-2025)

---

**Research completed:** 2026-01-22
**Ready for roadmap:** Yes

**Next step:** Use this summary as context for roadmap creation. Phase structure recommendations directly inform milestone definition.
