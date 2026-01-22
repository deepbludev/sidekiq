# Technology Stack for AI Chat Integration

**Project:** Sidekiq - AI Chat Application
**Researched:** 2026-01-22
**Focus:** Adding AI chat capabilities to existing Next.js foundation

## Executive Summary

The 2025 stack for adding AI chat to Next.js applications centers on **Vercel AI SDK 6.x** with **Server-Sent Events (SSE)** for streaming. Vercel's AI Gateway provides unified multi-provider access, but for enterprise features like guardrails and advanced observability, **Portkey AI Gateway** is the superior choice. The existing stack (Next.js 15, tRPC 11, Drizzle, Better Auth) is solid, but **tRPC cannot be used for streaming chat endpoints** due to fundamental incompatibility with the AI SDK's hooks.

**Confidence:** HIGH (verified with official docs and current releases)

---

## Core AI Stack

### AI SDK (Required)

| Package | Version | Purpose | Installation |
|---------|---------|---------|--------------|
| `ai` | `^6.0.48` | Core SDK for streaming text/objects, agents, and UI hooks | `pnpm add ai` |
| `@ai-sdk/openai` | `^3.0.x` | OpenAI provider (GPT-4, GPT-4o, etc.) | `pnpm add @ai-sdk/openai` |
| `@ai-sdk/anthropic` | `^3.0.13` | Anthropic provider (Claude models) | `pnpm add @ai-sdk/anthropic` |

**Why Vercel AI SDK:**
- **Industry standard** with 20+ million monthly downloads
- **Unified API** across all LLM providers (OpenAI, Anthropic, Google, etc.)
- **Native SSE streaming** with React hooks (`useChat`, `useCompletion`)
- **Built-in message management** with UIMessage type for persistence
- **Agent abstractions** in v6 for reusable AI agents (future Sidekiqs enhancement)
- **Excellent Next.js 15 integration** with App Router and React Server Components
- **Production-ready** error handling, retries, and state management

**AI SDK 6 Features (Latest):**
- Agent abstraction with `ToolLoopAgent` class
- Tool approval systems (human-in-the-loop)
- v3 Language Model Specification
- Migration from v5 is straightforward: `npx @ai-sdk/codemod v6`

**Confidence:** HIGH (verified with GitHub releases, official docs)

---

## AI Gateway (Multi-Provider Management)

### Option 1: Vercel AI Gateway (Recommended for Simplicity)

**When to use:**
- Already deploying on Vercel
- Need simple multi-provider routing
- Want built-in failover and load balancing
- Prefer minimal setup

**Pros:**
- Free tier with reasonable limits (25MB request size, 1-month cache TTL)
- Integrated with Vercel platform (logs, metrics)
- Zero additional infrastructure
- Model switching via string IDs: `'anthropic/claude-opus-4.5'` or `'openai/gpt-4o'`
- Automatic failover between providers
- BYOK (bring your own key) with no token markup

**Cons:**
- Limited guardrails and compliance features
- Basic observability compared to enterprise solutions
- Tied to Vercel ecosystem

**Configuration:**
```typescript
import { generateText } from 'ai';

const result = await generateText({
  model: 'anthropic/claude-opus-4.5', // Uses Vercel AI Gateway by default
  prompt: 'Hello!',
});
```

**Confidence:** MEDIUM (verified via official blog posts and docs, but Gateway announced May 2025 - recent feature)

### Option 2: Portkey AI Gateway (Recommended for Production/Enterprise)

**When to use:**
- Need advanced observability and analytics
- Require compliance (SOC2, HIPAA, GDPR, CCPA)
- Want enterprise guardrails (PII redaction, jailbreak detection)
- Need semantic caching (vs simple caching)
- Planning to scale with governance features

**Pros:**
- **Open-source** (MIT license) and self-hostable
- Routes to **250+ LLMs** with 50+ AI guardrails
- **Blazing fast** with integrated guardrails
- **Full observability**: detailed logs, latency metrics, token/cost analytics
- **Native Vercel AI SDK integration** (official provider)
- **Enterprise features**: role-based access control, policy enforcement
- **Semantic caching** (vs simple response caching)
- **Reliability**: automatic retries, fallback routing, load balancing

**Cons:**
- Additional infrastructure (self-hosted or Portkey Cloud)
- Free tier limited (10k logs, 90-day max cache age)
- Paid plans start at $49/month for premium features

**Integration:**
```typescript
import { createPortkey } from '@portkey-ai/vercel-provider';

const portkey = createPortkey({
  apiKey: process.env.PORTKEY_API_KEY,
});

const result = await generateText({
  model: portkey('anthropic/claude-opus-4.5'),
  prompt: 'Hello!',
});
```

**Official AI SDK Provider:** [ai-sdk.dev/providers/community-providers/portkey](https://ai-sdk.dev/providers/community-providers/portkey)

**Confidence:** HIGH (verified with official Portkey docs, GitHub repo, and AI SDK provider listing)

### Recommendation

**Start with Vercel AI Gateway** for MVP. Provider-specific packages (`@ai-sdk/openai`, `@ai-sdk/anthropic`) give you flexibility to switch to Portkey later without code changes to your chat logic.

**Migrate to Portkey** when you need:
- Advanced observability and cost tracking
- Compliance certifications
- Guardrails (PII redaction, content filtering)
- Multi-tenant governance

---

## Streaming Architecture

### SSE (Server-Sent Events) - RECOMMENDED

**Why SSE over WebSockets:**
- **Purpose-built for AI streaming**: 80% of real-time use cases are server-to-client
- **Simpler infrastructure**: Standard HTTP, no protocol upgrade required
- **Vercel AI SDK native support**: `useChat` hook returns streaming responses
- **Firewall-friendly**: Runs over HTTP/HTTPS
- **Automatic reconnection**: Built into EventSource API
- **Easier to scale**: Stateless, works with standard HTTP load balancers
- **Next.js 15 integration**: ReadableStream API in Route Handlers

**When to use WebSockets instead:**
- Bidirectional communication required (collaborative editing, multiplayer games)
- Client needs to send frequent updates to server during streaming

**Confidence:** HIGH (verified with multiple sources including HackerNoon, Ricky Spears, and sniki.dev)

### Implementation Pattern

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

```typescript
// Client component
'use client';
import { useChat } from 'ai/react';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  return (
    <form onSubmit={handleSubmit}>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
      ))}
      <input value={input} onChange={handleInputChange} />
    </form>
  );
}
```

**Confidence:** HIGH (verified with official AI SDK docs and Next.js guides)

---

## State Management for Chat

### Vercel AI SDK Hooks (Recommended)

**Use `useChat` from `ai/react`:**
- Decoupled state management (integrates with Zustand, Redux, MobX if needed)
- Handles SSE streaming complexity automatically
- Manages optimistic updates, error rollback, loading states
- Reduces 200-300 lines of boilerplate to 10-20 lines
- Built-in message types: `UIMessage` (source of truth for UI state)

**Why NOT React Query for streaming chat:**
- React Query is designed for request/response patterns, not streaming
- Vercel AI SDK hooks already handle state, caching, and error recovery
- Duplicate state management adds complexity
- React Query is still perfect for non-streaming tRPC endpoints (Sidekiq CRUD, team management, etc.)

**Hybrid Approach (Recommended for Sidekiq):**
- **AI SDK hooks** (`useChat`) for streaming chat messages
- **React Query + tRPC** for everything else (Sidekiqs, teams, threads, settings)

**Confidence:** HIGH (verified with AI SDK 5/6 blog posts and official docs)

---

## tRPC Integration (Critical Constraint)

### The Problem

**tRPC cannot be used with Vercel AI SDK's streaming hooks** (`useChat`, `useCompletion`).

**Why:**
- tRPC transforms all outputs through its middleware/serialization pipeline
- Vercel AI SDK requires raw `ReadableStream` responses
- `useChat` hook requires a standard fetch-compatible API endpoint (string URL)
- tRPC's SSE support returns iterators, not the expected stream format

**Attempted Workarounds:**
- Converting tRPC iterator to ReadableStream + LangChainAdapter (complex, brittle)
- Using trpc-openapi to create REST-like endpoints (defeats tRPC's purpose)

**Community Consensus (2025):**
- No official first-class support for tRPC + Vercel AI SDK streaming
- GitHub discussions (vercel/ai#3236, trpc/trpc#6103) confirm incompatibility

**Confidence:** HIGH (verified with GitHub issue discussions and developer reports)

### Recommended Architecture

**Separate concerns:**

```
Streaming Chat Endpoints (Next.js Route Handlers):
  ├─ app/api/chat/route.ts          → POST /api/chat (AI SDK streamText)
  ├─ app/api/chat/generate-title/route.ts  → POST /api/chat/generate-title
  └─ Uses: Vercel AI SDK directly

Non-Streaming tRPC Endpoints:
  ├─ sidekiqs.create                → Create Sidekiq
  ├─ sidekiqs.update                → Update Sidekiq
  ├─ threads.list                   → List threads
  ├─ threads.delete                 → Delete thread
  ├─ teams.* (all team operations)
  └─ Uses: tRPC + React Query
```

**Benefits:**
- Keep tRPC for type-safe CRUD operations
- Use AI SDK's battle-tested streaming for chat
- Clear separation of concerns
- Both approaches work within Next.js App Router

**Confidence:** HIGH (based on community consensus and official AI SDK patterns)

---

## Message Persistence

### Database (PostgreSQL + Drizzle)

**Use for:**
- Long-term message storage
- Thread history
- Full-text search across conversations
- Audit logs

**AI SDK 5+ Approach (Prefix-based schema):**

```typescript
// schema.ts (Drizzle)
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),

  // Metadata
  model: text('model'), // e.g., 'gpt-4o'
  tokenCount: integer('token_count'),

  // Tool calls (prefix-based approach)
  toolCallId: text('tool_call_id'),
  toolName: text('tool_name'),
  toolArgs: jsonb('tool_args'),
  toolResult: jsonb('tool_result'),
});
```

**Why prefix-based over JSONB:**
- Avoids data integrity issues with polymorphic JSONB columns
- Type-safe column access
- Better query performance
- Easier to add indexes on specific fields

**Official Example:** [vercel-labs/ai-sdk-persistence-db](https://github.com/vercel-labs/ai-sdk-persistence-db)

**Persistence Flow:**
```typescript
const { messages, append } = useChat({
  api: '/api/chat',
  onFinish: async (message) => {
    // Save to database via tRPC
    await trpc.messages.create.mutate({
      threadId,
      role: message.role,
      content: message.content,
      // ... metadata
    });
  },
});
```

**Confidence:** HIGH (verified with official Vercel Labs repo and AI SDK 5 blog)

### Redis (Optional but Recommended)

**Use Redis for:**
- Short-term message caching (recent 10-20 messages)
- Session state for active conversations
- Rate limiting counters
- Semantic caching for repeated queries

**When to add Redis:**
- When scaling beyond 100 concurrent users
- When conversation history becomes expensive to query
- When implementing semantic caching for cost reduction (up to 90% savings)

**Redis Data Structures:**
```
# Session cache (recent messages)
SET mysession:<userId>:<threadId>:messages JSON
EXPIRE mysession:<userId>:<threadId>:messages 3600

# Rate limiting
INCR ratelimit:<userId>:sidekiq_creation
EXPIRE ratelimit:<userId>:sidekiq_creation 3600
```

**Best Practices (2025):**
- Use server-side message IDs for consistency across sessions
- Separate short-term (Redis) from long-term (PostgreSQL) memory
- Redis hashes for message storage, RediSearch for queries
- TTL for automatic cleanup (e.g., 1 hour for active sessions)

**Recommended Libraries:**
- `ioredis` - Full-featured Redis client
- `upstash/redis` - Serverless Redis (Vercel-compatible)

**When to skip Redis (for now):**
- MVP with <50 users
- Cost optimization can come later
- PostgreSQL sufficient for chat history

**Confidence:** HIGH (verified with Upstash blog, Redis official docs, and Azure tutorials)

---

## Supporting Libraries

### Message Formatting & Rendering

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-markdown` | `^9.0.0` | Render markdown in messages | When supporting markdown in chat responses |
| `remark-gfm` | `^4.0.0` | GitHub-flavored markdown | For tables, task lists, strikethrough |
| `react-syntax-highlighter` | `^15.6.0` | Code block syntax highlighting | For code-heavy AI responses |

**Confidence:** MEDIUM (common pattern in AI chat apps, not verified with official sources)

### Token Counting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `js-tiktoken` | `^1.0.10` | Token counting for OpenAI models | When tracking costs or implementing context limits |

**Note:** AI SDK handles token counting internally, only needed for advanced cost tracking.

**Confidence:** MEDIUM (common but not required for MVP)

---

## Installation Guide

### Core AI Chat Setup

```bash
# Core AI SDK
pnpm add ai

# Provider packages (choose based on models you support)
pnpm add @ai-sdk/openai @ai-sdk/anthropic

# Optional: Markdown rendering
pnpm add react-markdown remark-gfm react-syntax-highlighter
pnpm add -D @types/react-syntax-highlighter
```

### Environment Variables

```bash
# .env (add to existing)

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Vercel AI Gateway (if using)
# No additional keys required - uses provider keys above

# Portkey AI Gateway (if using)
PORTKEY_API_KEY=ptk-...
```

**Confidence:** HIGH (verified with official docs)

---

## What NOT to Use

### ❌ LangChain / LangGraph

**Why avoid:**
- Adds significant complexity and abstraction overhead
- Vercel AI SDK provides everything needed for chat streaming
- LangChain's Python origins lead to TypeScript awkwardness
- Not needed unless building complex agent workflows (v2 feature)

**When to reconsider:**
- If building advanced RAG (Retrieval-Augmented Generation)
- If implementing complex multi-step agent reasoning (future milestone)

**Confidence:** HIGH (based on ecosystem trends and Vercel's positioning)

### ❌ Socket.io / WebSockets

**Why avoid:**
- Overkill for unidirectional streaming
- More complex infrastructure (stateful connections)
- SSE is simpler and sufficient for AI chat

**When to reconsider:**
- If adding real-time collaboration features (v2)
- If adding multi-user cursor tracking

**Confidence:** HIGH (verified with multiple sources on SSE vs WebSocket for AI chat)

### ❌ Custom Streaming Implementation

**Why avoid:**
- Vercel AI SDK handles streaming complexity
- Reinventing the wheel leads to bugs (connection drops, partial message reconstruction)
- 200-300 lines of boilerplate vs 10-20 with AI SDK

**Confidence:** HIGH (based on AI SDK value proposition)

### ❌ Multiple AI SDKs (e.g., OpenAI SDK + Anthropic SDK directly)

**Why avoid:**
- Each provider has different APIs and streaming formats
- Vercel AI SDK provides unified interface
- Harder to add new providers later

**When to use provider SDKs directly:**
- If needing provider-specific features not exposed by AI SDK
- For non-chat use cases (embeddings, fine-tuning, etc.)

**Confidence:** HIGH (based on AI SDK design philosophy)

---

## Alternatives Considered

### Cloudflare AI Gateway

**Pros:**
- Edge-based caching (low latency globally)
- Free tier with generous limits
- Supports 25+ providers

**Cons:**
- Less mature observability than Portkey
- Fewer guardrails
- Better suited for Cloudflare Workers deployment

**Why not recommended:**
- Project deploys to Vercel, not Cloudflare
- Portkey provides better feature set for production

**Confidence:** MEDIUM (based on feature comparison articles)

### OpenRouter

**Pros:**
- Single API for 200+ models
- Pay-as-you-go pricing
- No need to manage multiple API keys

**Cons:**
- Markup on model costs (not bring-your-own-key)
- Less control over provider selection
- No guardrails or governance features

**Why not recommended:**
- Project spec requires BYOK (bring your own key)
- Higher costs at scale

**Confidence:** MEDIUM (based on comparison articles)

---

## Migration Path

### Phase 1: MVP (Current)
- Vercel AI SDK Core (`ai@6.0.48`)
- Provider packages (`@ai-sdk/openai`, `@ai-sdk/anthropic`)
- Next.js Route Handlers for streaming
- PostgreSQL + Drizzle for persistence
- No AI Gateway (direct provider access)

### Phase 2: Scale (50-500 users)
- Add Vercel AI Gateway for unified provider management
- Implement Redis caching for active sessions
- Add semantic caching for cost optimization

### Phase 3: Enterprise (500+ users)
- Migrate to Portkey AI Gateway for observability
- Add guardrails (PII redaction, content filtering)
- Implement role-based access controls
- Advanced cost tracking and analytics

**Confidence:** HIGH (based on product roadmap and scaling patterns)

---

## Summary Recommendation

### Install Now

```bash
pnpm add ai @ai-sdk/openai @ai-sdk/anthropic
```

### Architecture

- **Streaming:** Next.js Route Handlers with AI SDK's `streamText` + SSE
- **Client State:** AI SDK's `useChat` hook (not React Query for streaming)
- **Non-Streaming API:** Keep tRPC + React Query for CRUD operations
- **Persistence:** PostgreSQL (existing) with prefix-based message schema
- **Multi-Provider:** Start with direct provider access, add Vercel AI Gateway when needed

### Redis (Defer to Phase 2)

Add Redis when:
- Active users exceed 50-100 concurrent
- PostgreSQL queries for chat history become slow
- Implementing semantic caching for cost savings

**Confidence:** HIGH (all recommendations verified with official sources)

---

## Sources

### Official Documentation
- [Vercel AI SDK Introduction](https://ai-sdk.dev/docs/introduction)
- [AI SDK GitHub Releases](https://github.com/vercel/ai/releases)
- [AI SDK Anthropic Provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)
- [Portkey AI Gateway Documentation](https://portkey.ai/features/ai-gateway)
- [Portkey GitHub Repository](https://github.com/Portkey-AI/gateway)
- [Portkey Vercel AI SDK Provider](https://ai-sdk.dev/providers/community-providers/portkey)
- [Vercel AI SDK Persistence DB](https://github.com/vercel-labs/ai-sdk-persistence-db)

### Technical Articles & Guides
- [Streaming in Next.js 15: WebSockets vs Server-Sent Events | HackerNoon](https://hackernoon.com/streaming-in-nextjs-15-websockets-vs-server-sent-events)
- [Go with SSE for Your AI Chat App • sniki.dev](https://www.sniki.dev/posts/sse-vs-websockets-for-ai-chat/)
- [Real-time AI in Next.js: How to stream responses with the Vercel AI SDK - LogRocket](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/)
- [Vercel AI SDK Complete Guide: Building Production-Ready AI Chat Apps - DEV Community](https://dev.to/pockit_tools/vercel-ai-sdk-complete-guide-building-production-ready-ai-chat-apps-with-nextjs-4cp6)

### AI Gateway Comparisons
- [Best LLM Gateways in 2025 | Helicone](https://www.helicone.ai/blog/top-llm-gateways-comparison-2025)
- [Portkey vs Vercel AI Gateway Comparison](https://portkey.ai/buyers-guide/ai-gateway-solutions)
- [AI Gateway vs Vercel AI Gateway Comparison | ResultantAI](https://resultantai.com/compare/portkey)

### Redis & Persistence
- [Saving AI SDK v5 Chat Messages in Redis | Upstash Blog](https://upstash.com/blog/ai-sdk-chat-history)
- [Redis for GenAI apps | Redis Docs](https://redis.io/docs/latest/develop/get-started/redis-in-ai/)
- [Build smarter AI agents with Redis memory management](https://redis.io/blog/build-smarter-ai-agents-manage-short-term-and-long-term-memory-with-redis/)

### Integration Challenges
- [Any way to integrate with tRPC? · vercel/ai · Discussion #3236](https://github.com/vercel/ai/discussions/3236)
- [Any way to integrate with Vercel AI SDK? · Issue #6103 · trpc/trpc](https://github.com/trpc/trpc/issues/6103)

### Release Announcements
- [AI SDK 6 - Vercel](https://vercel.com/blog/ai-sdk-6)
- [AI SDK 5 - Vercel](https://vercel.com/blog/ai-sdk-5)

---

*Research completed: 2026-01-22*
*Next step: Use this stack analysis to inform roadmap phase structure*
