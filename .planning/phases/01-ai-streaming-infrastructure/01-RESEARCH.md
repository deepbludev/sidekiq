# Phase 1: AI Streaming Infrastructure - Research

**Researched:** 2026-01-22
**Domain:** Vercel AI SDK, AI Gateway, SSE Streaming, Message Persistence
**Confidence:** HIGH

## Summary

This phase establishes the AI streaming pipeline using Vercel AI SDK with AI Gateway for multi-provider access. The research confirms that the AI SDK (now at v6.x) provides a mature, well-documented approach for streaming AI responses using Server-Sent Events (SSE). The `streamText` + `useChat` combination handles streaming complexity automatically, while the AI Gateway provides unified access to OpenAI, Anthropic, and Google models through a single API key.

The standard architecture uses a dedicated Route Handler (`/api/chat`) separate from tRPC for streaming, as tRPC integration with `useChat` is not directly supported. Message persistence is handled via the `onFinish` callback with `consumeStream()` to ensure saves complete even if the client disconnects. The existing database schema already supports the required fields for messages (model, tokens, metadata as JSONB).

**Primary recommendation:** Use the standard `useChat` + `streamText` pattern with a dedicated `/api/chat` Route Handler. Keep tRPC for non-streaming operations. Use `consumeStream()` for reliable persistence and `onAbort` for handling user cancellation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^4.0+ (current v6.x) | Core AI SDK - `streamText`, `convertToModelMessages` | Official Vercel SDK, unified streaming API |
| `@ai-sdk/react` | ^1.0+ | React hooks - `useChat` | Official React bindings, handles SSE automatically |
| `@ai-sdk/gateway` | ^1.0+ | AI Gateway provider instance | Unified access to 20+ providers via single API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `drizzle-orm` | ^0.41.0 | Database ORM | Already in project - message persistence |
| `zod` | ^3.24.2 | Schema validation | Already in project - request/response validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AI Gateway | Direct provider SDKs (`@ai-sdk/openai`, `@ai-sdk/anthropic`) | More control but requires separate API keys and no automatic failover |
| `useChat` | Custom `streamText` consumption | More flexibility but significant boilerplate for streaming state management |
| SSE | WebSockets via tRPC subscriptions | WebSockets are overkill for unidirectional streaming; SSE is simpler and native to AI SDK |

**Installation:**
```bash
pnpm add ai @ai-sdk/react @ai-sdk/gateway
```

**Environment Variables:**
```bash
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_api_key
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts         # Streaming endpoint (NOT tRPC)
│   └── (chat)/
│       └── page.tsx             # Chat UI with useChat
├── lib/
│   ├── ai/
│   │   ├── models.ts            # Model registry/config
│   │   └── gateway.ts           # AI Gateway instance
│   └── validations/
│       └── chat.ts              # Zod schemas for chat
└── server/
    └── api/
        └── routers/
            └── thread.ts        # tRPC for non-streaming ops
```

### Pattern 1: Streaming Route Handler
**What:** Dedicated API route for AI streaming, separate from tRPC
**When to use:** All AI chat streaming - this is the only supported pattern for `useChat`
**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
// app/api/chat/route.ts
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { db } from '@/server/db';
import { messages, threads } from '@/server/db/schema';

export async function POST(req: Request) {
  const { messages: uiMessages, threadId }: {
    messages: UIMessage[];
    threadId: string
  } = await req.json();

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4.5'),
    messages: await convertToModelMessages(uiMessages),
    abortSignal: req.signal, // Enable client abort
    onAbort: async ({ steps }) => {
      // Handle user stopping the stream
      console.log('Stream aborted after', steps.length, 'steps');
    },
  });

  // Ensure stream is consumed even if client disconnects
  result.consumeStream();

  return result.toUIMessageStreamResponse({
    originalMessages: uiMessages,
    onFinish: async ({ messages: finalMessages, usage }) => {
      // Persist messages after completion
      const assistantMessage = finalMessages[finalMessages.length - 1];
      await db.insert(messages).values({
        id: assistantMessage.id,
        threadId,
        role: 'assistant',
        content: assistantMessage.parts
          .filter(p => p.type === 'text')
          .map(p => p.text)
          .join(''),
        model: 'anthropic/claude-sonnet-4.5',
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        metadata: { finishReason: 'stop' },
      });
    },
  });
}
```

### Pattern 2: useChat Client Hook
**What:** React hook that manages chat state and SSE streaming
**When to use:** Any component that needs to send/receive streaming messages
**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export function ChatInterface({ threadId }: { threadId: string }) {
  const [input, setInput] = useState('');

  const {
    messages,
    sendMessage,
    stop,
    status,
    error
  } = useChat({
    api: '/api/chat',
    body: { threadId }, // Extra data sent with each request
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: (message) => {
      console.log('Message complete:', message.id);
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <strong>{message.role}:</strong>
          {message.parts.map((part, i) =>
            part.type === 'text' ? <span key={i}>{part.text}</span> : null
          )}
        </div>
      ))}

      <form onSubmit={(e) => {
        e.preventDefault();
        sendMessage({ text: input });
        setInput('');
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button type="button" onClick={stop}>Stop</button>
        ) : (
          <button type="submit">Send</button>
        )}
      </form>
    </div>
  );
}
```

### Pattern 3: Model Registry (Config-Driven)
**What:** Centralized model configuration for easy additions
**When to use:** Managing available models, pricing tiers, provider icons
**Example:**
```typescript
// lib/ai/models.ts
import { gateway } from '@ai-sdk/gateway';

export type ModelConfig = {
  id: string;           // e.g., 'anthropic/claude-sonnet-4.5'
  name: string;         // Display name
  provider: 'openai' | 'anthropic' | 'google';
  pricingTier: '$' | '$$' | '$$$';
  speedTier: 'fast' | 'balanced' | 'quality';
};

export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', pricingTier: '$', speedTier: 'fast' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai', pricingTier: '$$', speedTier: 'balanced' },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'openai', pricingTier: '$$$', speedTier: 'quality' },
  // Anthropic
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'anthropic', pricingTier: '$', speedTier: 'fast' },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'anthropic', pricingTier: '$$', speedTier: 'balanced' },
  { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'anthropic', pricingTier: '$$$', speedTier: 'quality' },
  // Google
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', pricingTier: '$', speedTier: 'fast' },
  { id: 'google/gemini-3-pro', name: 'Gemini 3 Pro', provider: 'google', pricingTier: '$$$', speedTier: 'quality' },
];

export const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5';

export function getModel(modelId: string) {
  return gateway(modelId);
}
```

### Anti-Patterns to Avoid
- **Using tRPC for streaming:** tRPC subscriptions don't integrate with `useChat`. Keep AI streaming on a dedicated Route Handler.
- **Edge Runtime for database operations:** Edge has no Node.js fs/path APIs and can't maintain DB connections. Use Node.js runtime for the chat route.
- **Storing ModelMessages instead of UIMessages:** Always persist `UIMessage` format for correct restoration of chat history including tool results and metadata.
- **Not calling `consumeStream()`:** Without this, client disconnection aborts the stream before `onFinish` runs, losing the response.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE stream parsing | Custom EventSource handlers | `useChat` hook | Handles reconnection, parsing, state management automatically |
| Multi-provider switching | Provider-specific SDK setup | AI Gateway model strings | Single API, automatic failover, no code changes |
| Message format conversion | Manual message reshaping | `convertToModelMessages()` | Handles all edge cases, tool results, attachments |
| Stream-to-UI rendering | Manual chunk accumulation | `message.parts` iteration | SDK handles delta accumulation, partial updates |
| Token counting | Custom tokenizer | Provider-reported `usage` in `onFinish` | Accurate per-provider, no maintenance |
| Abort handling | Custom AbortController wiring | `req.signal` + `stop()` function | SDK handles cleanup, callbacks, state reset |

**Key insight:** The AI SDK handles significant complexity around stream lifecycle, reconnection, partial states, and provider differences. Custom implementations inevitably miss edge cases the SDK has already solved.

## Common Pitfalls

### Pitfall 1: Client Disconnect Loses Response
**What goes wrong:** User closes tab or loses connection, AI response is lost
**Why it happens:** Default backpressure stops stream consumption when client disconnects
**How to avoid:** Call `result.consumeStream()` before returning the response
**Warning signs:** Partial messages in database, `onFinish` not being called

### Pitfall 2: Edge Runtime Database Issues
**What goes wrong:** Database operations fail in streaming route
**Why it happens:** Edge runtime can't maintain persistent connections or use Node.js APIs
**How to avoid:** Use default Node.js runtime for `/api/chat` route (don't export `runtime = 'edge'`)
**Warning signs:** `Module not found: fs`, connection timeout errors

### Pitfall 3: Message ID Conflicts
**What goes wrong:** Duplicate IDs when restoring chat from database
**Why it happens:** Client-generated IDs conflict with server-generated IDs on reload
**How to avoid:** Use `generateMessageId` option in `toUIMessageStreamResponse` for server-side ID generation
**Warning signs:** React key warnings, messages disappearing or duplicating

### Pitfall 4: Stop Button Not Working
**What goes wrong:** Clicking "Stop" doesn't stop the AI generation
**Why it happens:** `abortSignal` not passed to `streamText`, or using incompatible patterns
**How to avoid:** Pass `abortSignal: req.signal` to `streamText` and use `onAbort` callback
**Warning signs:** Stream continues after stop clicked, no `onAbort` call

### Pitfall 5: Tool Helper Not Used
**What goes wrong:** Build failures with tool definitions
**Why it happens:** Using plain objects instead of `tool()` helper
**How to avoid:** Always import `tool` from 'ai' and use `inputSchema` not `parameters` (for future tool usage)
**Warning signs:** TypeScript errors about tool shape, runtime crashes

### Pitfall 6: Version Mismatch in Tutorials
**What goes wrong:** Code examples don't work
**Why it happens:** AI SDK evolved rapidly (v4 -> v5 -> v6), tutorials may be outdated
**How to avoid:** Check SDK version with `npm info ai version`, use official docs at ai-sdk.dev
**Warning signs:** Deprecated function warnings, API signature mismatches

## Code Examples

Verified patterns from official sources:

### Saving User Message Immediately, AI Message on Completion
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
// app/api/chat/route.ts
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { db } from '@/server/db';
import { messages } from '@/server/db/schema';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const { messages: uiMessages, threadId, userMessageId }: {
    messages: UIMessage[];
    threadId: string;
    userMessageId: string;
  } = await req.json();

  // Save user message immediately (optimistic - already shown in UI)
  const userMessage = uiMessages[uiMessages.length - 1];
  await db.insert(messages).values({
    id: userMessageId,
    threadId,
    role: 'user',
    content: userMessage.parts.filter(p => p.type === 'text').map(p => p.text).join(''),
    createdAt: new Date(),
  });

  const startTime = Date.now();

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4.5'),
    messages: await convertToModelMessages(uiMessages),
    abortSignal: req.signal,
  });

  result.consumeStream();

  return result.toUIMessageStreamResponse({
    originalMessages: uiMessages,
    generateMessageId: () => nanoid(), // Server-generated IDs
    onFinish: async ({ messages: finalMessages, usage, finishReason }) => {
      const latencyMs = Date.now() - startTime;
      const assistantMessage = finalMessages[finalMessages.length - 1];

      await db.insert(messages).values({
        id: assistantMessage.id,
        threadId,
        role: 'assistant',
        content: assistantMessage.parts
          .filter(p => p.type === 'text')
          .map(p => p.text)
          .join(''),
        model: 'anthropic/claude-sonnet-4.5',
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        metadata: {
          finishReason,
          latencyMs,
          aborted: finishReason === 'abort',
        },
        createdAt: new Date(),
      });

      // Update thread lastActivityAt
      await db.update(threads)
        .set({ lastActivityAt: new Date() })
        .where(eq(threads.id, threadId));
    },
  });
}
```

### Smart Auto-Scroll with Intersection Observer
```typescript
// Source: https://tuffstuff9.hashnode.dev/intuitive-scrolling-for-chatbot-message-streaming
'use client';

import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

export function ChatScrollAnchor({
  isStreaming,
  messages
}: {
  isStreaming: boolean;
  messages: unknown[];
}) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '0px 0px -150px 0px', // Trigger before reaching absolute bottom
  });

  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming && !inView) {
      // User scrolled up during streaming - show "scroll to bottom" button
      return;
    }

    if (isStreaming || messages.length > 0) {
      anchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isStreaming, inView, messages.length]);

  return (
    <div ref={ref}>
      <div ref={anchorRef} className="h-px" />
    </div>
  );
}
```

### Typing Indicator Component
```typescript
// Recommendation: Three-dot pulsing indicator (simple, universally understood)
'use client';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground ml-2">
        AI is thinking...
      </span>
    </div>
  );
}
```

### Dynamic Model Discovery (for future model picker)
```typescript
// Source: https://vercel.com/docs/ai-gateway/models-and-providers
import { gateway } from '@ai-sdk/gateway';

export async function getAvailableModels() {
  const { models } = await gateway.getAvailableModels();

  return models
    .filter(m => m.modelType === 'language')
    .map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      pricing: m.pricing,
      contextWindow: m.contextWindow,
    }));
}

// Or via REST API (no auth required)
export async function fetchModelsFromAPI() {
  const response = await fetch('https://ai-gateway.vercel.sh/v1/models');
  const { data } = await response.json();
  return data.filter((m: any) => m.type === 'language');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `StreamingTextResponse` | `toUIMessageStreamResponse()` | AI SDK v5 | Deprecated helper; new one handles UIMessage format |
| `append({ content, role })` | `sendMessage({ text })` | AI SDK v5 | API change in useChat |
| `convertToCoreMessages()` | `convertToModelMessages()` | AI SDK v6 | Renamed for clarity |
| `toAIStream()` | `toUIMessageStreamResponse()` | AI SDK v5+ | Old method deprecated |
| Per-provider SDK setup | AI Gateway strings | AI Gateway launch | Single API, no provider SDKs needed |
| `messages` as CoreMessage[] | `messages` as UIMessage[] | AI SDK v5 | UIMessage is now source of truth |

**Deprecated/outdated:**
- `StreamingTextResponse`: Use `toUIMessageStreamResponse()` instead
- `toAIStream()`: Deprecated, use `toUIMessageStreamResponse()`
- `createStreamableUI()`: RSC pattern, not needed for standard SSE streaming
- Edge Runtime for chat routes: Node.js runtime preferred for database access

## Open Questions

Things that couldn't be fully resolved:

1. **Partial Response Saving on Abort**
   - What we know: `onAbort` receives `steps` array with completed steps
   - What's unclear: Whether partial text content is available in `onAbort` for saving
   - Recommendation: Test during implementation; may need custom chunk tracking if needed

2. **AI Gateway OIDC vs API Key in Development**
   - What we know: OIDC works on Vercel deployments, API key needed locally
   - What's unclear: Best pattern for local dev vs production
   - Recommendation: Use `AI_GATEWAY_API_KEY` env var; Vercel OIDC auto-works in production

3. **Exact Model String Format for Latest Models**
   - What we know: Format is `creator/model-name` (e.g., `anthropic/claude-sonnet-4.5`)
   - What's unclear: Exact strings for newest models (GPT-5.2, Gemini 3) may vary
   - Recommendation: Verify model strings via `gateway.getAvailableModels()` at runtime

## Sources

### Primary (HIGH confidence)
- [AI SDK Getting Started: Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) - Core setup pattern
- [AI SDK Reference: streamText](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) - Full API reference
- [AI SDK Reference: useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) - React hook API
- [AI SDK: Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) - Persistence patterns
- [AI SDK: Stopping Streams](https://ai-sdk.dev/docs/advanced/stopping-streams) - Abort handling
- [AI Gateway: Models & Providers](https://vercel.com/docs/ai-gateway/models-and-providers) - Model configuration
- [AI Gateway Provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) - Gateway setup

### Secondary (MEDIUM confidence)
- [Vercel Blog: AI SDK 5](https://vercel.com/blog/ai-sdk-5) - Version context
- [Vercel Blog: AI SDK 6](https://vercel.com/blog/ai-sdk-6) - Latest features
- [DEV.to: Vercel AI SDK Complete Guide](https://dev.to/pockit_tools/vercel-ai-sdk-complete-guide-building-production-ready-ai-chat-apps-with-nextjs-4cp6) - Practical patterns
- [tRPC: Subscriptions](https://trpc.io/docs/server/subscriptions) - SSE comparison

### Tertiary (LOW confidence, verify during implementation)
- [GitHub Discussion: tRPC + AI SDK](https://github.com/vercel/ai/discussions/3236) - Integration patterns
- [GitHub Issue: Stop button issues](https://github.com/vercel/ai/issues/9707) - Known edge cases
- [Hashnode: Chat Scroll Patterns](https://tuffstuff9.hashnode.dev/intuitive-scrolling-for-chatbot-message-streaming) - UX patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Vercel documentation and SDK
- Architecture: HIGH - Well-documented patterns, official examples
- Persistence: HIGH - Official docs + verified community patterns
- Pitfalls: MEDIUM - Mix of official docs and community reports

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - AI SDK is stable)
