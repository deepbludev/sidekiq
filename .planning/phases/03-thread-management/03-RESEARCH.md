# Phase 3: Thread Management - Research

**Researched:** 2026-01-23
**Domain:** Thread CRUD operations, auto-title generation, tRPC mutations
**Confidence:** HIGH

## Summary

This phase implements thread lifecycle management: create, delete, archive, pin, and rename functionality. The core technical work involves building a tRPC router for thread operations, integrating with the existing Drizzle schema (which already has `isPinned`, `isArchived`, and `title` columns), and implementing auto-title generation using a fast/cheap LLM model.

The existing codebase provides strong foundations: the `threads` table schema is complete with all needed columns, tRPC is configured with protected procedures, and the AI SDK's `generateText` is available for non-streaming title generation. The main work is creating the thread router, updating the chat page routing structure, and wiring up frontend mutations.

**Primary recommendation:** Build a `threadRouter` with tRPC mutations for all CRUD operations, use `generateText` with a budget model (e.g., `openai/gpt-4o-mini`) and a constrained prompt for title generation, and add shadcn/ui `context-menu` and `alert-dialog` components for thread actions UX.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tRPC | ^11.0.0 | Type-safe API layer | Already configured in project, protectedProcedure available |
| drizzle-orm | ^0.41.0 | Database operations | Already in use, schema complete with thread columns |
| AI SDK | ^6.0.48 | Title generation via generateText | Already configured with gateway, non-streaming call |
| zod | ^3.24.2 | Input validation | Already used throughout codebase |
| nanoid | ^5.1.6 | ID generation | Already used for message/thread IDs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-context-menu | (to install) | Right-click thread actions | Thread item context menu |
| @radix-ui/react-alert-dialog | (to install) | Delete confirmation | Delete thread confirmation dialog |
| sonner | ^2.0.7 | Toast notifications | Archive undo, error feedback |
| next/navigation | built-in | Client-side navigation | Navigate after delete/create |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tRPC mutations | Direct API routes | tRPC gives type-safety, invalidation; API routes simpler but lose types |
| generateText | streamText | Title generation is short, non-streaming is simpler and sufficient |
| Context menu | Dropdown only | Context menu provides familiar right-click UX (per user decision) |

**Installation:**
```bash
pnpm dlx shadcn@latest add context-menu alert-dialog
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── server/api/routers/
│   └── thread.ts           # Thread tRPC router with all mutations
├── lib/validations/
│   └── thread.ts           # Zod schemas for thread operations
├── lib/ai/
│   └── title.ts            # Title generation function
├── components/thread/
│   ├── thread-item.tsx     # Sidebar thread item with actions
│   ├── thread-context-menu.tsx  # Right-click menu
│   └── delete-thread-dialog.tsx # Confirmation dialog
└── app/(dashboard)/chat/
    ├── page.tsx            # /chat - new chat state
    └── [threadId]/
        └── page.tsx        # /chat/[threadId] - existing thread
```

### Pattern 1: tRPC Router with Protected Mutations
**What:** All thread operations require authentication via protectedProcedure
**When to use:** Any data mutation that belongs to a user
**Example:**
```typescript
// Source: Existing project pattern + tRPC docs
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@sidekiq/server/api/trpc";
import { threads } from "@sidekiq/server/db/schema";
import { eq, and } from "drizzle-orm";

export const threadRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const threadId = nanoid();
      const [thread] = await ctx.db
        .insert(threads)
        .values({
          id: threadId,
          userId: ctx.session.user.id,
          title: input.title ?? null,
          lastActivityAt: new Date(),
        })
        .returning();
      return thread;
    }),

  delete: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before delete
      await ctx.db
        .delete(threads)
        .where(
          and(
            eq(threads.id, input.threadId),
            eq(threads.userId, ctx.session.user.id)
          )
        );
      return { success: true };
    }),
});
```

### Pattern 2: Title Generation with Cheap Model
**What:** Use generateText with a budget model and strict word limit prompt
**When to use:** After first AI response completes (not during streaming)
**Example:**
```typescript
// Source: AI SDK docs + community best practices
import { generateText } from "ai";
import { getModel } from "@sidekiq/lib/ai/models";

const TITLE_MODEL = "openai/gpt-4o-mini"; // Fast, cheap model

export async function generateThreadTitle(
  userMessage: string,
  assistantMessage: string
): Promise<string> {
  const { text } = await generateText({
    model: getModel(TITLE_MODEL),
    prompt: `Generate a concise title (3-6 words) for this conversation.
Extract the key topic only. No quotes, no punctuation at end.

User: ${userMessage.slice(0, 500)}
Assistant: ${assistantMessage.slice(0, 500)}

Title:`,
    maxOutputTokens: 20,
  });

  // Clean up: remove quotes, trim, limit length
  return text.trim().replace(/^["']|["']$/g, "").slice(0, 100);
}
```

### Pattern 3: Optimistic Updates with tRPC + TanStack Query
**What:** Update UI immediately, rollback on error
**When to use:** Pin/archive toggles for instant feedback
**Example:**
```typescript
// Source: TanStack Query docs + tRPC integration
import { api } from "@sidekiq/trpc/react";

function useTogglePin() {
  const utils = api.useUtils();

  return api.thread.togglePin.useMutation({
    onMutate: async ({ threadId }) => {
      await utils.thread.list.cancel();
      const previousThreads = utils.thread.list.getData();

      utils.thread.list.setData(undefined, (old) =>
        old?.map((t) =>
          t.id === threadId ? { ...t, isPinned: !t.isPinned } : t
        )
      );

      return { previousThreads };
    },
    onError: (err, variables, context) => {
      if (context?.previousThreads) {
        utils.thread.list.setData(undefined, context.previousThreads);
      }
    },
    onSettled: () => {
      utils.thread.list.invalidate();
    },
  });
}
```

### Pattern 4: URL-Based Thread Routing
**What:** /chat for new state, /chat/[threadId] for existing threads
**When to use:** Thread creation and navigation
**Example:**
```typescript
// app/(dashboard)/chat/page.tsx - New chat state
export default async function NewChatPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // No thread ID - this is the "new chat" state
  // Thread will be created on first message send
  return <ChatInterface threadId={null} />;
}

// app/(dashboard)/chat/[threadId]/page.tsx - Existing thread
export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // Load thread and messages
  const thread = await db.query.threads.findFirst({
    where: and(
      eq(threads.id, threadId),
      eq(threads.userId, session.user.id)
    ),
    with: { messages: true },
  });

  if (!thread) redirect("/chat");

  return <ChatInterface threadId={thread.id} initialMessages={thread.messages} />;
}
```

### Anti-Patterns to Avoid
- **Creating thread on 'New Chat' click:** Per user decision, thread only created on first message send
- **Updating title on every message:** Title is set once, no auto-update on topic drift
- **Using expensive model for titles:** Always use budget model regardless of thread model
- **Deleting without ownership check:** Always verify userId matches before delete/archive
- **Blocking UI for title generation:** Title generation happens async after response completes

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confirmation dialogs | Custom modal with focus trap | AlertDialog from shadcn/ui | Accessibility, keyboard handling, focus management |
| Context menus | Custom positioned dropdown | ContextMenu from shadcn/ui | Platform-native right-click, submenus, keyboard nav |
| Cache invalidation | Manual state management | tRPC useUtils().invalidate() | Handles query keys, refetching, optimistic updates |
| Toast with undo | Custom timer + state | sonner toast with action | Built-in undo pattern, auto-dismiss, queue management |
| ID generation | Math.random() or uuid | nanoid | Shorter IDs, URL-safe, collision-resistant |

**Key insight:** Thread CRUD operations are common patterns. The tRPC + TanStack Query combination provides battle-tested cache invalidation and optimistic updates. The shadcn/ui components handle accessibility edge cases (focus traps, keyboard navigation) that are easy to get wrong when building from scratch.

## Common Pitfalls

### Pitfall 1: Thread Creation Race Conditions
**What goes wrong:** User sends message before thread is created, or thread created multiple times
**Why it happens:** Creating thread and sending first message are separate operations
**How to avoid:**
- Create thread atomically with first message in a single API call
- Or use transaction: create thread, then insert message
- Frontend should disable send button while thread creation is in flight
**Warning signs:** Duplicate threads, messages without threadId, 404 errors on send

### Pitfall 2: Stale Thread List After Mutations
**What goes wrong:** Sidebar shows deleted/renamed thread until page refresh
**Why it happens:** tRPC cache not invalidated after mutations
**How to avoid:**
- Always call `utils.thread.list.invalidate()` in onSettled
- For optimistic updates, also update cache in onMutate
**Warning signs:** UI shows old data, requires manual refresh to see changes

### Pitfall 3: Title Generation Blocking Response
**What goes wrong:** User waits for title before seeing AI response
**Why it happens:** Title generation called synchronously in response path
**How to avoid:**
- Generate title AFTER onFinish callback completes
- Use fire-and-forget pattern: don't await title update in response flow
- Title appears asynchronously in sidebar (user doesn't wait)
**Warning signs:** Slow first response, AI response appears with noticeable delay

### Pitfall 4: Unsafe Delete Without Ownership Check
**What goes wrong:** User can delete other users' threads via crafted request
**Why it happens:** Only checking threadId, not userId
**How to avoid:**
- Always include `userId: ctx.session.user.id` in WHERE clause
- Use `and()` combinator: `and(eq(threads.id, input.threadId), eq(threads.userId, ctx.session.user.id))`
**Warning signs:** Security audit findings, data leaked between users

### Pitfall 5: Archive Auto-Unarchive Not Implemented
**What goes wrong:** Archived thread stays archived when user continues conversation
**Why it happens:** Forgot to check isArchived when sending message
**How to avoid:**
- In chat API, check if thread.isArchived is true
- If so, set isArchived = false before processing message
- Per CONTEXT.md: "Archived threads can be continued - auto-unarchive on new message"
**Warning signs:** Users confused why archived thread isn't receiving messages

## Code Examples

Verified patterns from official sources:

### Thread List Query
```typescript
// Source: Drizzle ORM docs + existing project patterns
import { eq, desc, and, or } from "drizzle-orm";

list: protectedProcedure.query(async ({ ctx }) => {
  return ctx.db.query.threads.findMany({
    where: and(
      eq(threads.userId, ctx.session.user.id),
      // Optionally filter archived
      // eq(threads.isArchived, false)
    ),
    orderBy: [
      desc(threads.isPinned),     // Pinned first
      desc(threads.lastActivityAt) // Then by activity
    ],
    columns: {
      id: true,
      title: true,
      isPinned: true,
      isArchived: true,
      lastActivityAt: true,
      messageCount: true,
    },
  });
}),
```

### Soft Delete (Archive)
```typescript
// Source: Drizzle ORM docs - update with returning
archive: protectedProcedure
  .input(z.object({ threadId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db
      .update(threads)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(
        and(
          eq(threads.id, input.threadId),
          eq(threads.userId, ctx.session.user.id)
        )
      )
      .returning({ id: threads.id });

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return updated;
  }),
```

### Inline Title Edit
```typescript
// Source: Project pattern + Zod validation
rename: protectedProcedure
  .input(z.object({
    threadId: z.string(),
    title: z.string().min(1).max(255),
  }))
  .mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db
      .update(threads)
      .set({ title: input.title, updatedAt: new Date() })
      .where(
        and(
          eq(threads.id, input.threadId),
          eq(threads.userId, ctx.session.user.id)
        )
      )
      .returning({ id: threads.id, title: threads.title });

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return updated;
  }),
```

### Alert Dialog for Delete Confirmation
```typescript
// Source: shadcn/ui alert-dialog-demo
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@sidekiq/components/ui/alert-dialog";

function DeleteThreadDialog({
  open,
  onOpenChange,
  onConfirm,
  threadTitle
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{threadTitle}".
            If you want to hide it temporarily, consider archiving instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| REST APIs with manual cache | tRPC + React Query | 2023 | Type-safe mutations, automatic cache invalidation |
| useState for server data | TanStack Query | 2022 | Deduplication, refetching, optimistic updates |
| Streaming title generation | generateText (non-streaming) | N/A | Title generation doesn't need streaming - simpler |
| next/router (pages) | next/navigation (app) | Next.js 13+ | useRouter from next/navigation in app router |

**Deprecated/outdated:**
- `trpc.useMutation` direct usage is replaced by `api.router.mutation.useMutation()` pattern in tRPC v11
- `useRouter` from `next/router` doesn't work in app router - use `next/navigation`

## Open Questions

Things that couldn't be fully resolved:

1. **Title generation failure handling**
   - What we know: generateText can fail (rate limit, network error)
   - What's unclear: Per CONTEXT.md this is Claude's discretion
   - Recommendation: Use "New conversation" as fallback title, log error, don't block user

2. **Where thread title displays**
   - What we know: Sidebar shows title, per CONTEXT.md "Where thread title displays" is Claude's discretion
   - What's unclear: Whether to show in chat header too
   - Recommendation: Show in both sidebar and chat header for context, sync via tRPC query

3. **Archived threads access location**
   - What we know: Per CONTEXT.md "Where archived threads are accessible" is Claude's discretion
   - What's unclear: Separate section vs filter vs modal
   - Recommendation: Add "Archived" section in sidebar below active threads, collapsed by default

4. **Keyboard shortcut for New Chat**
   - What we know: Per CONTEXT.md this is Claude's discretion
   - Recommendation: Cmd/Ctrl+Shift+O (matches Claude desktop app pattern)

## Sources

### Primary (HIGH confidence)
- Context7 /websites/trpc_io - tRPC router, mutations, useUtils invalidation
- Context7 /drizzle-team/drizzle-orm-docs - update/delete/insert with returning
- Context7 /websites/tanstack_query_v5 - optimistic updates, onMutate/onError/onSettled
- Context7 /websites/ai-sdk_dev - generateText for non-streaming title generation
- Context7 /websites/nextjs - App Router dynamic routes, useRouter navigation
- Context7 /websites/radix-ui-primitives - Context menu component API
- shadcn/ui registry - context-menu-demo, alert-dialog-demo

### Secondary (MEDIUM confidence)
- OpenAI Community discussion - Title generation prompt patterns
- Project codebase analysis - Existing patterns in schema.ts, trpc.ts, models.ts

### Tertiary (LOW confidence)
- LibreChat GitHub discussion - General approach to auto-titling (not specific implementation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, well-documented
- Architecture: HIGH - Patterns verified against official docs and existing codebase
- Pitfalls: HIGH - Based on common tRPC/React Query issues and project-specific decisions

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain, established patterns)
