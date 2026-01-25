# Phase 7: Sidekiq Chat Integration - Research

**Researched:** 2026-01-25
**Domain:** AI Chat System Integration, UI State Management, Database Relations
**Confidence:** HIGH

## Summary

This phase integrates Sidekiq (custom AI assistants) with the existing chat infrastructure. The core challenge is prepending Sidekiq instructions as system messages without storing them in the message history, while updating UI components to reflect the active Sidekiq.

The implementation leverages existing patterns from the codebase:
- **AI SDK v6** already handles system messages via `convertToModelMessages` and `streamText`
- **Thread schema** already has `sidekiqId` foreign key - just needs population
- **HoverCard** and **Popover** patterns from model-picker can be reused
- **DefaultChatTransport** supports custom `body` for passing `sidekiqId`

**Primary recommendation:** Extend the existing chat API route to look up Sidekiq instructions and prepend as system message on the server-side, rather than sending instructions from client. This prevents instruction leakage and keeps client payload small.

## Standard Stack

### Core (Already in Place)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^6.0.48 | AI SDK with streamText, useChat | Already configured, supports system messages |
| `@ai-sdk/react` | ^3.0.50 | React integration with useChat hook | DefaultChatTransport for custom body |
| `drizzle-orm` | ^0.41.0 | Type-safe database queries | Schema already has sidekiqId relation |
| `@tanstack/react-query` | ^5.69.0 | Server state via tRPC | Cache invalidation for thread list |
| `@radix-ui/react-*` | Various | Hover cards, popovers, dialogs | Established UI patterns |

### Supporting (Already in Place)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `fuse.js` | ^7.1.0 | Fuzzy search | Sidekiq picker search |
| `cmdk` | ^1.1.1 | Command palette base | Cmd+Shift+S picker modal |
| `lucide-react` | ^0.562.0 | Icons | Sidekiq indicators |

### No New Dependencies Required

All required functionality exists in current stack. No new packages needed.

## Architecture Patterns

### Recommended Data Flow

```
User clicks Sidekiq → Navigate to /chat?sidekiq={id}
                    ↓
     ChatInterface detects sidekiqId from URL
                    ↓
     Fetch Sidekiq data (name, avatar, conversationStarters, defaultModel)
                    ↓
     Create thread on first message with sidekiqId
                    ↓
     API receives threadId/sidekiqId → looks up instructions
                    ↓
     Prepend system message (server-side) → streamText
```

### Pattern 1: Server-Side System Message Injection

**What:** Fetch Sidekiq instructions on API server and prepend to messages
**When to use:** Always for Sidekiq chats - instructions never sent from client
**Example:**

```typescript
// Source: Existing pattern + AI SDK docs
// In /api/chat/route.ts

// 1. Look up Sidekiq if thread has one
let systemMessage: string | null = null;
if (thread.sidekiqId) {
  const sidekiq = await db.query.sidekiqs.findFirst({
    where: eq(sidekiqs.id, thread.sidekiqId),
    columns: { instructions: true },
  });
  systemMessage = sidekiq?.instructions ?? null;
}

// 2. Build messages with optional system prefix
const modelMessages = await convertToModelMessages(uiMessages);
const messagesWithSystem = systemMessage
  ? [{ role: 'system' as const, content: systemMessage }, ...modelMessages]
  : modelMessages;

// 3. Stream with system message
const result = streamText({
  model: getModel(modelId),
  messages: messagesWithSystem,
  abortSignal: req.signal,
});
```

### Pattern 2: URL-Based Sidekiq Selection

**What:** Pass sidekiqId via query parameter, not in transport body
**When to use:** Starting new Sidekiq chats from sidebar/list
**Example:**

```typescript
// Navigation: /chat?sidekiq=abc123
// In chat/page.tsx (server component)
export default async function NewChatPage({
  searchParams
}: {
  searchParams: Promise<{ sidekiq?: string }>
}) {
  const { sidekiq: sidekiqId } = await searchParams;

  // Fetch Sidekiq data if ID provided
  const sidekiq = sidekiqId
    ? await db.query.sidekiqs.findFirst({...})
    : null;

  return (
    <ChatInterface
      threadId={null}
      sidekiq={sidekiq}  // Pass full sidekiq object
    />
  );
}
```

### Pattern 3: Chat Interface Sidekiq Context

**What:** Extend ChatInterface props to accept Sidekiq context
**When to use:** All chat pages
**Example:**

```typescript
interface ChatInterfaceProps {
  threadId: string | null;
  initialMessages?: UIMessage[];
  initialTitle?: string | null;
  initialModel?: string | null;
  // NEW: Sidekiq context
  sidekiq?: {
    id: string;
    name: string;
    description: string | null;
    avatar: SidekiqAvatar;
    conversationStarters: string[];
    defaultModel: string | null;
  } | null;
}
```

### Pattern 4: Thread Creation with SidekiqId

**What:** Include sidekiqId when creating thread, update Sidekiq stats
**When to use:** First message in Sidekiq chat
**Example:**

```typescript
// In /api/chat/route.ts when creating thread
const [newThread] = await db
  .insert(threads)
  .values({
    id: newThreadId,
    userId: session.user.id,
    sidekiqId: sidekiqId ?? null,  // From request body
    title: null,
    activeModel: modelId ?? sidekiq?.defaultModel,
    lastActivityAt: new Date(),
  })
  .returning();

// Update Sidekiq usage stats
if (sidekiqId) {
  await db
    .update(sidekiqs)
    .set({
      lastUsedAt: new Date(),
      threadCount: sql`${sidekiqs.threadCount} + 1`,
    })
    .where(eq(sidekiqs.id, sidekiqId));
}
```

### Pattern 5: Reusable Sidekiq Indicator Component

**What:** Shared component for showing Sidekiq avatar + name
**When to use:** Chat header, input area, sidebar threads
**Example:**

```typescript
// components/sidekiq/sidekiq-indicator.tsx
interface SidekiqIndicatorProps {
  sidekiq: {
    id: string;
    name: string;
    avatar: SidekiqAvatar;
    description?: string | null;
  };
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function SidekiqIndicator({
  sidekiq,
  showDescription,
  size = 'md',
  onClick
}: SidekiqIndicatorProps) {
  return (
    <button onClick={onClick} className="flex items-center gap-2">
      <SidekiqAvatar name={sidekiq.name} avatar={sidekiq.avatar} size={size} />
      <div>
        <span className="font-medium">{sidekiq.name}</span>
        {showDescription && sidekiq.description && (
          <p className="text-muted-foreground text-xs line-clamp-1">
            {sidekiq.description}
          </p>
        )}
      </div>
    </button>
  );
}
```

### Anti-Patterns to Avoid

- **Sending instructions from client:** Security risk, instructions could be leaked or modified
- **Storing system message in messages table:** Wasteful, creates duplicate data
- **Allowing Sidekiq switch mid-conversation:** Per CONTEXT.md, Sidekiq is locked to thread
- **Using localStorage for Sidekiq state:** Use URL/server state for shareable links
- **Fetching Sidekiq data in every render:** Use React Query caching via tRPC

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command palette for Sidekiq picker | Custom keyboard handling | cmdk + existing Dialog | Already used in codebase |
| Hover preview cards | Custom tooltip | @radix-ui/react-hover-card | model-hover-card pattern exists |
| Fuzzy search in picker | Simple includes() | fuse.js | Already used in thread search |
| Avatar generation | Custom logic | `createDefaultAvatar()` | Already in lib/utils/avatar.ts |
| Thread list with Sidekiq data | Separate queries | Drizzle relations | Schema already has relation |

**Key insight:** Most UI patterns needed already exist in Phase 4 (model picker) and Phase 6 (Sidekiq CRUD). The challenge is composition, not invention.

## Common Pitfalls

### Pitfall 1: Stale Sidekiq Data in Thread List
**What goes wrong:** Thread shows old Sidekiq name/avatar after Sidekiq is updated
**Why it happens:** Thread list caches Sidekiq data, doesn't refetch on Sidekiq mutation
**How to avoid:** Include Sidekiq in thread query relation, invalidate on Sidekiq update
**Warning signs:** Sidebar shows wrong Sidekiq name for existing threads

### Pitfall 2: Instructions Not Applied on Resume
**What goes wrong:** Returning to Sidekiq thread doesn't apply instructions
**Why it happens:** Only new thread path looks up Sidekiq, existing thread skips
**How to avoid:** Always lookup via thread.sidekiqId in API, not just on creation
**Warning signs:** Second message in resumed thread ignores Sidekiq personality

### Pitfall 3: Race Condition in Thread Creation
**What goes wrong:** Thread created without sidekiqId, Sidekiq not associated
**Why it happens:** sidekiqId not passed in request body, or passed incorrectly
**How to avoid:** Validate sidekiqId in chat request schema, verify it exists
**Warning signs:** New Sidekiq chats show as regular threads in sidebar

### Pitfall 4: URL State Lost on Navigation
**What goes wrong:** Selected Sidekiq lost when clicking sidebar then back
**Why it happens:** Using component state instead of URL state for sidekiqId
**How to avoid:** Keep sidekiqId in URL until thread created, then use threadId
**Warning signs:** Refreshing /chat loses Sidekiq selection

### Pitfall 5: Empty State Shows Default Instead of Sidekiq Starters
**What goes wrong:** Empty state shows default prompts, not Sidekiq conversation starters
**Why it happens:** EmptyState component not receiving Sidekiq starters prop
**How to avoid:** Pass conversationStarters to EmptyState when Sidekiq is active
**Warning signs:** Sidekiq chat shows generic "Write a short story" instead of custom starters

### Pitfall 6: Deleted Sidekiq Breaks Thread
**What goes wrong:** Thread with deleted Sidekiq shows error or crashes
**Why it happens:** Component expects Sidekiq data, gets null from relation
**How to avoid:** Handle null sidekiq gracefully, show "[Sidekiq deleted]" placeholder
**Warning signs:** 500 error or blank page when opening old Sidekiq thread

## Code Examples

### Extending Chat Request Schema

```typescript
// Source: lib/validations/chat.ts (extend existing)
export const chatRequestSchema = z.object({
  messages: z.array(uiMessageSchema).min(1),
  threadId: z.string().optional(),
  model: z.string().optional().default(DEFAULT_MODEL),
  // NEW: Optional sidekiqId for new thread creation
  sidekiqId: z.string().optional(),
});
```

### Thread List with Sidekiq Relation

```typescript
// Source: server/api/routers/thread.ts (extend existing)
list: protectedProcedure
  .input(listThreadsInputSchema)
  .query(async ({ ctx, input }) => {
    return ctx.db.query.threads.findMany({
      where: eq(threads.userId, ctx.session.user.id),
      orderBy: [desc(threads.isPinned), desc(threads.lastActivityAt)],
      columns: {
        id: true,
        title: true,
        isPinned: true,
        isArchived: true,
        lastActivityAt: true,
        messageCount: true,
        sidekiqId: true,  // NEW
      },
      // NEW: Include related Sidekiq data
      with: {
        sidekiq: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }),
```

### Sidekiq Picker Command Dialog

```typescript
// Source: components/sidekiq/sidekiq-picker.tsx (new)
// Pattern from: model-picker + cmdk
export function SidekiqPicker({
  open,
  onOpenChange,
  onSelect,
}: SidekiqPickerProps) {
  const { data: sidekiqs } = api.sidekiq.list.useQuery();
  const [search, setSearch] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <Command>
          <CommandInput
            placeholder="Search Sidekiqs..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No Sidekiqs found</CommandEmpty>
            <CommandGroup>
              {sidekiqs?.map((s) => (
                <CommandItem
                  key={s.id}
                  onSelect={() => {
                    onSelect(s.id);
                    onOpenChange(false);
                  }}
                >
                  <SidekiqAvatar name={s.name} avatar={s.avatar} size="sm" />
                  <span>{s.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
```

### Adding Keyboard Shortcut

```typescript
// Source: hooks/use-keyboard-shortcuts.ts (extend existing)
interface ShortcutHandlers {
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onFocusSearch?: () => void;
  onOpenSidekiqPicker?: () => void;  // NEW: Cmd+Shift+S
}

// In handler:
if (key === "s" && isMod && e.shiftKey && onOpenSidekiqPicker) {
  e.preventDefault();
  onOpenSidekiqPicker();
}
```

### Message Item with Sidekiq Avatar

```typescript
// Source: components/chat/message-item.tsx (extend existing)
interface MessageItemProps {
  message: UIMessage;
  isStreaming?: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
  // NEW: For AI messages, show Sidekiq avatar instead of generic
  sidekiqAvatar?: {
    name: string;
    avatar: SidekiqAvatar;
  } | null;
}

// In render for assistant messages:
{!isUser && sidekiqAvatar && (
  <SidekiqAvatar
    name={sidekiqAvatar.name}
    avatar={sidekiqAvatar.avatar}
    size="sm"
    className="shrink-0"
  />
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `convertToCoreMessages` | `convertToModelMessages` | AI SDK v6 | Must await, async function |
| Client-side system messages | Server-side injection | Best practice | Security, smaller payload |
| Bubble-based chat UI | Minimal lines style | Phase 2 decision | Sidekiq avatar placement differs |

**Deprecated/outdated:**
- `CoreMessage` type: Replaced by `ModelMessage` in AI SDK 6
- `generateId` option in useChat: Use `generateMessageId` callback

## Open Questions

### Claude's Discretion Items (from CONTEXT.md)

1. **Resume behavior: Whether sidebar click resumes recent thread or always creates new**
   - Recommendation: Always create new thread. Resuming adds complexity and may confuse users expecting fresh start.
   - Implementation: Sidebar Sidekiq click always navigates to `/chat?sidekiq={id}`

2. **Route design: /chat?sidekiq=id vs dedicated route pattern**
   - Recommendation: Use `/chat?sidekiq={id}` for new chats. Simpler, reuses existing chat page.
   - Existing threads use `/chat/{threadId}` as before (Sidekiq loaded via relation).

3. **Header info density: Avatar + name, or include description**
   - Recommendation: Avatar + name only. Description visible on click (popover).
   - Rationale: Keep header clean, description is secondary info.

4. **Color theming: Whether Sidekiq color influences chat UI accents**
   - Recommendation: NO color theming. Too complex, potential accessibility issues.
   - Keep consistent UI, Sidekiq color only in avatar.

5. **Input area indicator: Chip, placeholder text, or border accent**
   - Recommendation: Small chip/badge with Sidekiq avatar + name near input.
   - More visible than placeholder, less intrusive than border.

6. **Thread grouping: Mixed with regular threads by date vs separate section**
   - Recommendation: Mixed by date. Separate section fragments timeline.
   - Sidekiq threads distinguished by avatar/subtitle, not position.

7. **Thread creation timing: On first message vs on navigation**
   - Recommendation: On first message. Matches existing pattern, avoids empty threads.
   - Navigation sets sidekiqId in state, thread created with first send.

8. **Instruction updates: Whether existing threads use updated or original instructions**
   - Recommendation: Always use CURRENT instructions.
   - Rationale: User expects Sidekiq behavior to match current config. Snapshot adds complexity.

## Sources

### Primary (HIGH confidence)
- `/websites/ai-sdk_dev` (Context7) - System messages, convertToModelMessages, DefaultChatTransport
- Codebase analysis: `/api/chat/route.ts`, `schema.ts`, `sidekiq.ts` router

### Secondary (MEDIUM confidence)
- AI SDK v6 migration guide for CoreMessage → ModelMessage change
- Existing Phase 4 (model-picker) and Phase 6 (Sidekiq CRUD) patterns

### Tertiary (LOW confidence)
- None - all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, versions verified in package.json
- Architecture: HIGH - Patterns derived from existing codebase + official AI SDK docs
- Pitfalls: MEDIUM - Based on similar implementations, not production-verified

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (stable stack, low churn expected)
