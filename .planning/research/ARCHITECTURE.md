# Architecture Patterns: AI Chat with Streaming

**Domain:** Premium AI chat application with model-agnostic LLM access
**Researched:** 2026-01-22
**Confidence:** HIGH

## Executive Summary

Modern AI chat systems (2026) follow a split-responsibility architecture where streaming happens in Route Handlers (not tRPC), client state is managed via Vercel AI SDK hooks, and database persistence occurs server-side after streaming completes. The Vercel AI SDK provides the de facto standard for React-based AI chat interfaces.

**Key architectural decision:** Keep tRPC for CRUD operations (threads, messages, Sidekiqs) and use dedicated Next.js Route Handlers for AI streaming endpoints. This hybrid approach is standard practice in 2026.

## Recommended Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Chat UI (useChat hook from Vercel AI SDK)           │  │
│  │  - Manages streaming state                            │  │
│  │  - Optimistic updates                                 │  │
│  │  - Message history (UIMessage[])                      │  │
│  └────────────┬──────────────────────────┬────────────────┘  │
│               │                          │                   │
│               │ POST /api/chat           │ tRPC queries      │
│               │ (streaming)              │ (CRUD)            │
└───────────────┼──────────────────────────┼───────────────────┘
                │                          │
┌───────────────┼──────────────────────────┼───────────────────┐
│               │                          │                   │
│  ┌────────────▼──────────┐  ┌───────────▼──────────────┐    │
│  │ Route Handler         │  │ tRPC Router              │    │
│  │ /api/chat/route.ts    │  │ - threads.list()         │    │
│  │                       │  │ - threads.create()       │    │
│  │ - streamText()        │  │ - threads.delete()       │    │
│  │ - Tool execution      │  │ - messages.list()        │    │
│  │ - Message persistence │  │ - sidekiqs.list()        │    │
│  └───────────┬───────────┘  └──────────┬───────────────┘    │
│              │                         │                     │
│              │  ┌──────────────────────▼──────────────────┐  │
│              │  │  Drizzle ORM + PostgreSQL               │  │
│              │  │  - threads, messages, sidekiqs tables   │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                                │
│  ┌───────────▼────────────────────────────────────────────┐  │
│  │  LLM Provider (via Vercel AI Gateway)                  │  │
│  │  - OpenAI, Anthropic, etc.                             │  │
│  │  - Unified API key                                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                      Server Layer                            │
└──────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Chat UI** | Render messages, input handling, streaming visualization | Route Handler (POST /api/chat), tRPC (thread/message CRUD) |
| **useChat Hook** | Client state management, optimistic updates, streaming state | Route Handler via fetch |
| **Route Handler** | AI streaming orchestration, tool execution, message persistence | LLM Provider, Database |
| **tRPC Router** | CRUD operations for threads, messages, Sidekiqs, teams | Database |
| **Database** | Persistent storage for conversations, users, teams | Route Handler, tRPC Router |
| **LLM Provider** | AI model inference, streaming responses | Route Handler |

## Data Flow

### Message Sending Flow (Happy Path)

```
1. User types message → Click send
   ├─> useChat adds message optimistically to local state (instant UI update)
   └─> POST /api/chat with { messages: [...history, newMessage] }

2. Route Handler receives request
   ├─> Extracts threadId, messages, model from request
   ├─> Loads Sidekiq instructions if threadId has sidekiqId
   ├─> Constructs messages array: [systemMessage?, ...userMessages]
   └─> Calls streamText() with provider + messages

3. LLM Provider streams response
   ├─> Route Handler forwards stream to client via ReadableStream
   └─> Client receives chunks → useChat appends to message incrementally

4. Stream completes
   ├─> Route Handler persists both user message + assistant response
   ├─> Updates thread.lastActivityAt and thread.messageCount
   ├─> If first message in thread: trigger auto-title generation
   └─> Returns final message metadata (tokens, model)

5. Client receives completion
   ├─> useChat updates final message state
   └─> tRPC cache invalidates threads query (sidebar updates)
```

### Message Loading Flow

```
1. User navigates to /chat/[threadId]
   ├─> Server Component: trpc.threads.getById(threadId)
   └─> Server Component: trpc.messages.list(threadId)

2. Messages prefetched on server
   ├─> Hydrated into React Query cache
   └─> Passed to useChat via initialMessages prop

3. useChat initializes
   ├─> Sets local state from initialMessages
   └─> Ready to send/receive without additional fetch
```

### Conversation Branching (Schema Ready, v2 Feature)

The database schema already supports branching via `parentMessageId`:

```
Thread: "Help me debug code"
  ├─> Message 1 (user): "My code crashes"
  └─> Message 2 (assistant, parent=1): "Can you share the error?"
      ├─> Message 3a (user, parent=2): "Here's the stacktrace..."
      │   └─> Message 4a (assistant, parent=3a): "The issue is..."
      └─> Message 3b (user, parent=2): "Actually, different question..."
          └─> Message 4b (assistant, parent=3b): "Let me help with that..."
```

**For v1:** Always follow linear path (ignore siblings)
**For v2:** UI allows "edit message" → creates new branch from parent

## Integration Patterns with Existing Stack

### Pattern 1: Hybrid Route Handler + tRPC (RECOMMENDED)

**When to use:**
- AI streaming (Route Handler for /api/chat)
- Everything else (tRPC for CRUD)

**Rationale:**
- Route Handlers provide full control over streaming responses
- Vercel AI SDK's useChat hook expects POST /api/chat by default
- tRPC streaming works but lacks first-class support for useChat/useCompletion
- Separation of concerns: AI operations vs data operations

**Implementation:**
```typescript
// Route Handler: /app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, threadId, model } = await req.json();

  // Authenticate via Better Auth
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  // Load thread + Sidekiq context
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: { sidekiq: true }
  });

  // Construct messages with system prompt
  const fullMessages = thread?.sidekiq
    ? [{ role: 'system', content: thread.sidekiq.instructions }, ...messages]
    : messages;

  // Stream from LLM
  const result = await streamText({
    model: openai(model),
    messages: convertToModelMessages(fullMessages),
  });

  // Persist after stream completes (background)
  result.consumeStream().then(async () => {
    await db.insert(messages).values([
      { /* user message */ },
      { /* assistant response */ }
    ]);
  });

  return result.toUIMessageStreamResponse();
}

// tRPC Router: /server/api/routers/threads.ts
export const threadsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.threads.findMany({
      where: eq(threads.userId, ctx.session.user.id),
      orderBy: [desc(threads.isPinned), desc(threads.lastActivityAt)]
    });
  }),

  create: protectedProcedure
    .input(z.object({ sidekiqId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(threads).values({
        id: nanoid(),
        userId: ctx.session.user.id,
        sidekiqId: input.sidekiqId,
      }).returning();
    }),

  // ... delete, archive, pin, etc.
});
```

**Client usage:**
```typescript
'use client';

function ChatPage({ threadId, initialMessages }) {
  // Vercel AI SDK for streaming
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    id: threadId,
    initialMessages,
    body: { threadId, model: selectedModel },
  });

  // tRPC for CRUD
  const { data: threads } = api.threads.list.useQuery();
  const deleteThread = api.threads.delete.useMutation({
    onSuccess: () => router.push('/chat'),
  });

  return (/* Chat UI */);
}
```

### Pattern 2: State Management (useChat + TanStack Query)

**Responsibilities:**

| Concern | Managed By | Why |
|---------|-----------|-----|
| **Active conversation state** | `useChat` hook | SDK designed for streaming, optimistic updates, message lifecycle |
| **Thread list** | TanStack Query (via tRPC) | Standard data fetching, caching, invalidation |
| **Message history (initial load)** | TanStack Query → `useChat` | Prefetch on server, hydrate into useChat |
| **Optimistic message sending** | `useChat` | Built-in, handles rollback on error |
| **Thread metadata (title, model)** | TanStack Query | CRUD operations, independent of streaming |

**Coordination pattern:**
```typescript
const { mutate: createThread } = api.threads.create.useMutation({
  onSuccess: (newThread) => {
    // Invalidate list so sidebar updates
    utils.threads.list.invalidate();

    // Navigate to new thread
    router.push(`/chat/${newThread.id}`);

    // useChat on new page initializes with empty messages
  }
});

const { append } = useChat({
  onFinish: () => {
    // Stream finished → invalidate threads to update lastActivityAt in sidebar
    utils.threads.list.invalidate();
  }
});
```

### Pattern 3: Sidekiq Instructions Injection

**System message prepending:**
```typescript
// In Route Handler
async function buildMessagesWithContext(
  threadId: string,
  userMessages: Message[]
): Promise<Message[]> {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: { sidekiq: true }
  });

  if (!thread?.sidekiq) {
    return userMessages; // No Sidekiq, just user messages
  }

  // Prepend system message
  return [
    {
      role: 'system',
      content: thread.sidekiq.instructions
    },
    ...userMessages
  ];
}
```

**Security consideration:** Validate Sidekiq ownership/access before including instructions.

### Pattern 4: Message Persistence

**Three-stage approach (Vercel AI SDK recommendation):**

1. **Create thread (before first message)**
   ```typescript
   const thread = await api.threads.create.mutate({ sidekiqId });
   ```

2. **Load messages (on thread open)**
   ```typescript
   const initialMessages = await api.messages.list({ threadId });
   ```

3. **Save messages (after stream completes)**
   ```typescript
   // In Route Handler
   result.consumeStream().then(async () => {
     const userMessageId = nanoid();
     const assistantMessageId = nanoid();

     await db.insert(messages).values([
       {
         id: userMessageId,
         threadId,
         role: 'user',
         content: lastUserMessage.content,
         createdAt: new Date(),
       },
       {
         id: assistantMessageId,
         threadId,
         parentMessageId: userMessageId, // Linear chain for v1
         role: 'assistant',
         content: result.text,
         model: modelId,
         inputTokens: result.usage.promptTokens,
         outputTokens: result.usage.completionTokens,
         createdAt: new Date(),
       }
     ]);

     // Update thread metadata
     await db.update(threads)
       .set({
         lastActivityAt: new Date(),
         messageCount: sql`${threads.messageCount} + 2`,
         title: threadNeedsTitle ? await generateTitle(messages) : undefined,
       })
       .where(eq(threads.id, threadId));
   });
   ```

**Why consumeStream():** Ensures persistence even if client disconnects mid-stream.

## Database Schema Patterns

### Conversation Tree Structure (Ready for Branching)

The existing schema uses **Adjacency List** pattern via `parentMessageId`:

```typescript
export const messages = pgTable("message", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
  parentMessageId: text("parent_message_id"), // Self-reference for branching
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  // ... metadata fields
});
```

**Querying linear conversation (v1):**
```sql
-- Get messages in chronological order (ignoring branches)
SELECT * FROM message
WHERE thread_id = ?
ORDER BY created_at ASC;
```

**Querying with branching (v2):**
```sql
-- Recursive CTE to traverse from root to specific leaf
WITH RECURSIVE conversation_path AS (
  -- Base: root messages (no parent)
  SELECT * FROM message
  WHERE thread_id = ? AND parent_message_id IS NULL

  UNION ALL

  -- Recursive: follow specific branch
  SELECT m.* FROM message m
  INNER JOIN conversation_path cp ON m.parent_message_id = cp.id
  WHERE m.id = ? -- Target message in branch
)
SELECT * FROM conversation_path ORDER BY created_at;
```

**Index strategy (already in schema):**
```typescript
index("message_thread_idx").on(t.threadId),     // List all messages in thread
index("message_parent_idx").on(t.parentMessageId), // Find children of message
index("message_created_idx").on(t.createdAt),   // Chronological ordering
```

### Thread Metadata Tracking

**Denormalized fields for performance:**
```typescript
export const threads = pgTable("thread", {
  messageCount: integer("message_count").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
});
```

**Why denormalize:**
- Sidebar needs to sort threads by activity without joining messages
- Message count shown in UI without aggregation query
- Pinned threads stick to top (compound index for efficiency)

**Update pattern:**
```typescript
// After saving messages
await db.update(threads)
  .set({
    lastActivityAt: new Date(),
    messageCount: sql`${threads.messageCount} + 2`, // Atomic increment
  })
  .where(eq(threads.id, threadId));
```

### Message Metadata Storage

**Structured metadata for analytics/debugging:**
```typescript
export const messages = pgTable("message", {
  model: varchar("model", { length: 100 }),        // "gpt-4-turbo", "claude-3-opus"
  inputTokens: integer("input_tokens"),            // For cost tracking
  outputTokens: integer("output_tokens"),          // For cost tracking
  metadata: jsonb("metadata").$type<Record<string, unknown>>(), // Tool calls, etc.
});
```

**When to populate:**
- `model`: Always (user-selected or thread default)
- `inputTokens`/`outputTokens`: From `result.usage` after completion
- `metadata`: Tool call results, finish reason, custom data

## Patterns to Follow

### Pattern 1: Route Handler for Streaming

**What:** Use Next.js Route Handlers (not tRPC) for AI streaming endpoints.

**When:** Any LLM interaction with streaming responses.

**Why:**
- Vercel AI SDK's `useChat` hook defaults to POST /api/chat
- Route Handlers provide full control over ReadableStream
- tRPC streaming exists but lacks ecosystem support
- Easier authentication (just call auth.api.getSession)

**Example:**
```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, threadId, model } = await req.json();

  const result = await streamText({
    model: openai(model),
    messages: convertToModelMessages(messages),
  });

  // Background persistence
  result.consumeStream().then(() => saveMessages(threadId, messages, result));

  return result.toUIMessageStreamResponse();
}
```

### Pattern 2: Optimistic Updates with Rollback

**What:** Show user message immediately, roll back on error.

**When:** Sending messages, deleting threads, any mutation with visible UI change.

**Why:** Perceived performance, snappy UX (premium app requirement).

**Example:**
```typescript
const { append, messages, setMessages } = useChat();

async function handleSend(content: string) {
  const optimisticMessage = {
    id: 'temp-' + Date.now(),
    role: 'user',
    content,
  };

  // Add immediately
  setMessages([...messages, optimisticMessage]);

  try {
    await append({ content });
    // useChat handles the rest
  } catch (error) {
    // Rollback on failure
    setMessages(messages.filter(m => m.id !== optimisticMessage.id));
    toast.error("Failed to send message");
  }
}
```

### Pattern 3: Server-Side ID Generation

**What:** Generate message IDs on server, not client.

**When:** Persisting messages to database.

**Why:** Consistency across sessions, prevents ID conflicts, enables server-side deduplication.

**Example:**
```typescript
// In Route Handler after stream completes
const messageIds = {
  user: nanoid(),
  assistant: nanoid(),
};

await db.insert(messages).values([
  { id: messageIds.user, role: 'user', content: userContent },
  { id: messageIds.assistant, role: 'assistant', content: result.text }
]);

// Return IDs to client for cache synchronization (optional)
```

### Pattern 4: Background Stream Consumption

**What:** Use `consumeStream()` to ensure completion even if client disconnects.

**When:** Always, for every streaming response.

**Why:** Client might close tab, lose connection, or navigate away. Messages must persist regardless.

**Example:**
```typescript
const result = await streamText({ /* ... */ });

// Don't await this - let it complete in background
result.consumeStream().then(async () => {
  await saveToDatabase(result.text, result.usage);
  await updateThreadMetadata(threadId);
  await generateTitleIfNeeded(threadId);
}).catch(error => {
  logger.error("Background stream consumption failed", error);
});

// Return stream immediately
return result.toUIMessageStreamResponse();
```

### Pattern 5: Prefetch on Server, Hydrate on Client

**What:** Load messages via tRPC on server, pass to useChat as initialMessages.

**When:** Navigating to existing thread.

**Why:** Instant render (no loading spinner), SEO-friendly, leverages RSC.

**Example:**
```typescript
// app/chat/[threadId]/page.tsx (Server Component)
export default async function ChatPage({ params }) {
  const messages = await api.messages.list({ threadId: params.threadId });

  return <ChatUI threadId={params.threadId} initialMessages={messages} />;
}

// components/ChatUI.tsx (Client Component)
'use client';
function ChatUI({ threadId, initialMessages }) {
  const { messages, append } = useChat({
    id: threadId,
    initialMessages, // Hydrates from server
  });

  return <MessageList messages={messages} onSend={append} />;
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using tRPC for Streaming

**What goes wrong:** Forcing tRPC to handle AI streaming.

**Why it's bad:**
- `useChat` hook doesn't integrate with tRPC
- Manual stream handling in tRPC is complex
- No built-in optimistic updates
- Mixing concerns (data CRUD vs AI streaming)

**Instead:** Use Route Handler for streaming, tRPC for everything else.

### Anti-Pattern 2: Client-Side Message Persistence

**What goes wrong:** Saving messages to DB from client component.

**Why it's bad:**
- Race conditions (stream finishes before client saves)
- Client can't be trusted (can modify content, tokens)
- Disconnections mean lost messages
- Requires exposing mutation endpoint (security risk)

**Instead:** Persist server-side after stream completes via `consumeStream()`.

### Anti-Pattern 3: Blocking on Persistence

**What goes wrong:** Waiting for database save before returning stream.

**Why it's bad:**
- Delays first token (kills streaming UX)
- Database latency blocks user-visible response
- Defeats purpose of streaming (immediate feedback)

**Instead:** Return stream immediately, persist in background.

### Anti-Pattern 4: Loading Full History for Every Message

**What goes wrong:** Sending entire conversation to /api/chat on every message.

**Why it's bad:**
- Bandwidth waste (thousands of messages in long threads)
- Request size limits (4MB in Vercel)
- Unnecessary latency

**Instead:** Use `prepareSendMessagesRequest` to send only new message, reconstruct history server-side.

### Anti-Pattern 5: Ignoring parentMessageId in v1

**What goes wrong:** Not populating parentMessageId because branching is v2.

**Why it's bad:**
- Forces schema migration later
- Existing conversations can't branch
- More complex migration logic

**Instead:** Always set parentMessageId (linear chain: message N's parent is message N-1).

### Anti-Pattern 6: Mixing System Messages in User History

**What goes wrong:** Storing Sidekiq instructions as system message in messages table.

**Why it's bad:**
- Instructions change → all historical threads show new instructions
- Can't edit Sidekiq without affecting past conversations
- Database bloat (duplicate instructions per message)

**Instead:** Store instructions in sidekiqs table, inject at request time.

## Build Order Implications

### Phase 1: Foundation (Infrastructure)
**Rationale:** Can't stream without endpoints.

1. Route Handler setup (`/api/chat/route.ts`)
2. LLM provider integration (Vercel AI Gateway config)
3. Basic streaming (no persistence, just echo)
4. Authentication middleware in Route Handler

**Dependencies:** None (parallel with tRPC work)

### Phase 2: Core Chat (Streaming + Persistence)
**Rationale:** Minimum viable chat experience.

1. Message persistence (after stream completion)
2. Thread creation via tRPC
3. Message loading via tRPC
4. Chat UI with useChat hook
5. Optimistic updates

**Dependencies:** Phase 1 complete

### Phase 3: Thread Management
**Rationale:** Users need to organize conversations.

1. Thread list sidebar (tRPC query)
2. Thread metadata updates (lastActivityAt, messageCount)
3. Thread actions (delete, archive, pin)
4. Auto-title generation (after first exchange)

**Dependencies:** Phase 2 complete (needs working chat)

### Phase 4: Sidekiq Integration
**Rationale:** Core differentiator, but needs working chat first.

1. Sidekiq CRUD (tRPC)
2. System message injection in Route Handler
3. Thread ↔ Sidekiq association
4. Sidekiq indicators in UI

**Dependencies:** Phase 3 complete (threads must exist)

### Phase 5: Polish
**Rationale:** UX refinement after functionality works.

1. Loading states (skeletons, streaming indicators)
2. Error handling (retry, rollback)
3. Empty states
4. Scroll position preservation
5. Sidebar search

**Dependencies:** Phase 4 complete (all features exist)

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Concurrent streams** | Single process handles ~100 concurrent streams | Horizontal scaling (serverless) | Edge functions + global distribution |
| **Message storage** | PostgreSQL single instance | Read replicas for sidebar queries | Partition threads table by userId |
| **Token tracking** | In-memory aggregation, periodic flush | Background job for daily rollups | Time-series DB (ClickHouse) for analytics |
| **Rate limiting** | Application-level (in-memory) | Redis-based rate limiting | Cloudflare WAF + Redis cluster |
| **Cost tracking** | Synchronous after each message | Async queue for credit deduction | Event-driven (Kafka) with exactly-once semantics |

## Technology-Specific Notes

### Next.js 15 App Router
- **Server Components:** Use for initial message loading (no client JS)
- **Route Handlers:** Required for streaming (Server Actions can't return ReadableStream)
- **Streaming RSC:** Not applicable for chat (useChat is client-only)

### tRPC 11
- **httpBatchStreamLink:** Already configured (supports tRPC streaming if needed later)
- **Subscriptions:** Not needed (streaming happens in Route Handler)
- **SSR Prefetch:** Use for threads/messages on server, hydrate into React Query

### Vercel AI SDK
- **useChat:** Primary interface for chat UI
- **streamText:** Server-side streaming orchestration
- **toUIMessageStreamResponse:** Converts stream for useChat consumption
- **consumeStream:** Critical for background persistence

### Drizzle ORM
- **Transactions:** Use for message pairs (user + assistant together)
- **Prepared statements:** Cache thread queries (called frequently)
- **sql operator:** Use for atomic increments (messageCount)

### PostgreSQL
- **JSONB:** Store tool call results in metadata
- **Recursive CTEs:** Ready for branching queries (v2)
- **Partial indexes:** Consider for archived threads (reduce index size)

## Security Patterns

### Authentication in Route Handlers
```typescript
// Every Route Handler must authenticate
const session = await auth.api.getSession({ headers: req.headers });
if (!session?.user) {
  return new Response("Unauthorized", { status: 401 });
}
```

### Thread Ownership Validation
```typescript
// Before loading thread context
const thread = await db.query.threads.findFirst({
  where: and(
    eq(threads.id, threadId),
    eq(threads.userId, session.user.id) // Ensure ownership
  )
});

if (!thread) {
  return new Response("Not found", { status: 404 });
}
```

### Sidekiq Instruction Injection Safety
```typescript
// Validate Sidekiq access before injecting instructions
const sidekiq = await db.query.sidekiqs.findFirst({
  where: and(
    eq(sidekiqs.id, sidekiqId),
    or(
      eq(sidekiqs.ownerId, session.user.id),
      eq(sidekiqs.isPublic, true),
      // TODO: Team member check
    )
  )
});

// Only inject if authorized
if (sidekiq) {
  messages.unshift({ role: 'system', content: sidekiq.instructions });
}
```

### Input Validation
```typescript
// Validate all inputs with Zod
const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(100000),
  })),
  threadId: z.string().uuid(),
  model: z.string(),
});

const validatedInput = requestSchema.parse(await req.json());
```

## References & Sources

### Official Documentation
- [Vercel AI SDK - Next.js App Router Guide](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) - Architecture patterns, streaming setup
- [Vercel AI SDK - Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) - Persistence patterns, server-side IDs
- [TanStack Query - Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) - Client state management

### Community Patterns (2026)
- [Next.js Backend for Conversational AI in 2026](https://www.sashido.io/en/blog/nextjs-backend-conversational-ai-2026) - Split responsibility architecture
- [Real-time AI in Next.js: Streaming with Vercel AI SDK](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/) - Streaming patterns
- [The React + AI Stack for 2026](https://dev.to/abdullah-dev0/the-react-ai-stack-for-2026-14am) - Technology landscape

### Integration Discussions
- [Vercel AI SDK + tRPC Integration Discussion](https://github.com/vercel/ai/discussions/3236) - Why separate concerns
- [tRPC Streaming Issue](https://github.com/trpc/trpc/issues/6103) - Technical limitations

### Database Patterns
- [Modeling Hierarchical Tree Data in PostgreSQL](https://leonardqmarcq.com/posts/modeling-hierarchical-tree-data) - Adjacency list, LTREE, closure tables
- [Amazon DynamoDB Data Models for Chatbots](https://aws.amazon.com/blogs/database/amazon-dynamodb-data-models-for-generative-ai-chatbots/) - Conversation storage patterns
- [Building Stateful Conversations with Postgres and LLMs](https://medium.com/@levi_stringer/building-stateful-conversations-with-postgres-and-llms-e6bb2a5ff73e) - Persistence approaches

### State Management
- [Building WhatsApp-Like Optimistic Updates with TanStack Query](https://medium.com/better-dev-nextjs-react/building-whatsapp-like-optimistic-updates-with-tanstack-query-and-next-js-e8d89afbb658) - Real-world patterns
- [Vercel AI SDK v5 Internals - State Management](https://dev.to/yigit-konur/vercel-ai-sdk-v5-internals-part-4-decoupling-client-server-state-management-and-message-1lb1) - SDK architecture

### API Design
- [Next.js Server Actions vs Route Handlers](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers) - When to use each
- [Route Handler vs Server Action in Production](https://www.wisp.blog/blog/route-handler-vs-server-action-in-production-for-nextjs) - Production considerations
