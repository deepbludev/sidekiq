# Phase 4: Model Selection & Persistence - Research

**Researched:** 2026-01-23
**Domain:** Model picker UI, user preferences, Vercel AI SDK model handling
**Confidence:** HIGH

## Summary

This phase implements a rich model picker component following t3.chat's design patterns, with fuzzy search, favorites, provider grouping, and per-message model persistence. The codebase already has a solid foundation with `AVAILABLE_MODELS` configuration in `src/lib/ai/models.ts`, a `threads.activeModel` column, and per-message `model` tracking in the schema.

The standard approach combines shadcn/ui's Combobox pattern (built on cmdk + Popover) for the picker UI, Fuse.js for typo-tolerant fuzzy search, and Radix HoverCard for model detail cards. User preferences (favorites, default model) will be stored in the existing user schema via a new JSONB column, while model selection persists both at the thread level and per-message.

The Vercel AI SDK v6's `DefaultChatTransport` already supports dynamic body parameters, which the codebase uses. Model selection will flow through the existing `body.model` parameter to the `/api/chat` route.

**Primary recommendation:** Use cmdk (via shadcn/ui Command component) with Fuse.js for the model picker, add a `preferences` JSONB column to the user table for favorites/default model, and leverage the existing `activeModel` thread field with per-message model storage.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cmdk | 1.x | Command menu component | Used by Linear, Raycast, Vercel; shadcn/ui's Command is built on it |
| @radix-ui/react-popover | 1.1.x | Popover container for picker | Already used in project via Radix primitives |
| @radix-ui/react-hover-card | 1.1.x | Model detail hover card | Purpose-built for preview content on hover |
| fuse.js | 7.x | Fuzzy search | Zero dependencies, typo-tolerant, configurable threshold |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-scroll-area | 1.2.x | Scrollable list in picker | Already installed in project |
| lucide-react | 0.562.x | Provider/feature icons | Already installed in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fuse.js | command-score (cmdk default) | command-score is simpler but less configurable for typo tolerance |
| HoverCard | Tooltip | Tooltip is for brief hints; HoverCard supports rich content with links |
| JSONB preferences | Separate preferences table | JSONB simpler for v1, can migrate if needed |

**Installation:**
```bash
pnpm add cmdk fuse.js @radix-ui/react-popover @radix-ui/react-hover-card
# Or use shadcn CLI for Command component:
pnpm dlx shadcn@latest add command popover hover-card
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── model-picker/
│       ├── model-picker.tsx         # Main picker component
│       ├── model-picker-trigger.tsx # Compact button trigger
│       ├── model-picker-content.tsx # Popover content with search/groups
│       ├── model-item.tsx           # Individual model row
│       ├── model-hover-card.tsx     # Detail card on hover
│       └── index.ts                 # Barrel export
├── hooks/
│   └── use-model-selection.ts       # Model state management hook
└── lib/
    └── ai/
        └── models.ts                # Extended with descriptions, features
```

### Pattern 1: Combobox with Command
**What:** Combine Popover + Command for searchable model picker
**When to use:** Any searchable dropdown with keyboard navigation
**Example:**
```typescript
// Source: shadcn/ui Command + Popover composition
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

function ModelPicker({ value, onValueChange, models, favorites }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Fuse.js for fuzzy search
  const fuse = useMemo(() => new Fuse(models, {
    keys: ["name", "provider"],
    threshold: 0.4, // Allows typos
    ignoreLocation: true,
  }), [models])

  const filtered = search
    ? fuse.search(search).map(r => r.item)
    : models

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          {value ? models.find(m => m.id === value)?.name : "Select model"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="end">
        <Command shouldFilter={false}> {/* We handle filtering with Fuse */}
          <CommandInput
            placeholder="Search models..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            {favorites.length > 0 && (
              <CommandGroup heading="Favorites">
                {favorites.map(model => (
                  <ModelItem key={model.id} model={model} />
                ))}
              </CommandGroup>
            )}
            {/* Group by provider */}
            {providers.map(provider => (
              <CommandGroup key={provider} heading={provider}>
                {filtered.filter(m => m.provider === provider).map(model => (
                  <ModelItem key={model.id} model={model} />
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

### Pattern 2: Model State in Chat Interface
**What:** Manage selected model at chat interface level, pass to transport
**When to use:** When model selection affects streaming requests
**Example:**
```typescript
// Source: Vercel AI SDK docs - request-level body options
function ChatInterface({ threadId, initialModel }) {
  const [selectedModel, setSelectedModel] = useState(initialModel)

  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    body: threadId ? { threadId } : {},
  }), [threadId])

  const { messages, sendMessage } = useChat({ transport })

  const handleSubmit = async (text: string) => {
    await sendMessage(
      { text },
      { body: { model: selectedModel } } // Request-level override
    )
  }

  return (
    <>
      <ModelPicker value={selectedModel} onValueChange={setSelectedModel} />
      {/* ... rest of chat UI */}
    </>
  )
}
```

### Pattern 3: User Preferences with JSONB
**What:** Store favorites and default model in user preferences
**When to use:** Per-user settings that should sync across devices
**Example:**
```typescript
// Schema extension
import { jsonb } from "drizzle-orm/pg-core";

interface UserPreferences {
  defaultModel?: string;
  favoriteModels?: string[];
  // Prepared for Phase 6/7: sidekiqDefaults?: Record<string, string>;
}

export const user = pgTable("user", {
  // ... existing fields
  preferences: jsonb("preferences").$type<UserPreferences>().default({}),
});

// tRPC mutation for updating preferences
updatePreferences: protectedProcedure
  .input(z.object({
    defaultModel: z.string().optional(),
    favoriteModels: z.array(z.string()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const current = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.session.user.id),
      columns: { preferences: true },
    });

    const updated = {
      ...current?.preferences,
      ...input,
    };

    await ctx.db.update(user)
      .set({ preferences: updated })
      .where(eq(user.id, ctx.session.user.id));

    return updated;
  })
```

### Anti-Patterns to Avoid
- **Storing model selection only on thread:** Decision requires per-message storage for model switching mid-conversation
- **Using cmdk's built-in filter for fuzzy search:** It's simple substring matching, not typo-tolerant
- **Creating new Fuse instance on every render:** Memoize with useMemo
- **Popover without keyboard support:** cmdk handles this, but ensure focus management

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy search | Custom string matching | Fuse.js | Handles typos, scoring, multiple keys |
| Keyboard navigation | Custom key handlers | cmdk | Handles arrow keys, Enter, Escape, focus |
| Popover positioning | Manual positioning | Radix Popover | Collision detection, portal rendering |
| Hover delay logic | setTimeout chains | Radix HoverCard | Manages delays, dismissal, accessibility |
| Model validation | Manual string checks | Zod + isValidModel() | Already exists in codebase |

**Key insight:** The model picker has complex interactions (search, keyboard nav, hover states, grouping) that are fully solved by cmdk + Radix + Fuse.js. Building custom solutions leads to accessibility gaps and edge case bugs.

## Common Pitfalls

### Pitfall 1: Model Selection Not Persisting Across Tab Refresh
**What goes wrong:** User selects model, refreshes page, model resets to default
**Why it happens:** Model stored only in React state, not in thread record
**How to avoid:** Update `threads.activeModel` when model changes; load it on thread fetch
**Warning signs:** "New Chat" always starts with same model regardless of thread history

### Pitfall 2: Race Condition on Model Change During Streaming
**What goes wrong:** User changes model while AI is streaming, next chunk uses wrong model
**Why it happens:** Model passed per-request but UI allows change mid-stream
**How to avoid:** Disable model picker while `isStreaming === true`
**Warning signs:** Inconsistent responses within single AI message

### Pitfall 3: Favorites Not Syncing Across Devices
**What goes wrong:** User marks favorite on desktop, doesn't appear on mobile
**Why it happens:** Favorites stored in localStorage instead of database
**How to avoid:** Store favorites in `user.preferences` JSONB column (decision from CONTEXT.md)
**Warning signs:** Different favorites lists on different devices

### Pitfall 4: Model Hover Card Blocks Interaction
**What goes wrong:** Hover card appears and user can't click the model item
**Why it happens:** HoverCard content covers the trigger
**How to avoid:** Use `side="right"` or `side="left"` for HoverCard, not overlapping trigger
**Warning signs:** User has to move mouse away and back to select model

### Pitfall 5: Search Not Finding Model Despite Correct Spelling
**What goes wrong:** Typing "claude" doesn't find "Claude Sonnet 4"
**Why it happens:** Fuse.js threshold too strict or searching wrong keys
**How to avoid:** Set `threshold: 0.4`, `ignoreLocation: true`, search both `name` and `provider`
**Warning signs:** Only exact matches work

## Code Examples

Verified patterns from official sources:

### Fuse.js Configuration for Model Search
```typescript
// Source: https://www.fusejs.io/api/options.html
import Fuse from 'fuse.js'

const fuse = new Fuse(AVAILABLE_MODELS, {
  keys: [
    { name: 'name', weight: 2 },    // Prioritize model name
    { name: 'provider', weight: 1 }, // Also search provider
    { name: 'description', weight: 0.5 }, // Lower weight for description
  ],
  threshold: 0.4,        // 0 = exact, 1 = match anything. 0.4 allows typos
  ignoreLocation: true,  // Match anywhere in string, not just beginning
  includeScore: true,    // For debugging/sorting
})

const results = fuse.search("clade")  // Finds "Claude" despite typo
// Returns: [{ item: {...}, score: 0.25 }]
```

### HoverCard for Model Details
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/hover-card
import * as HoverCard from '@radix-ui/react-hover-card'

function ModelItemWithHover({ model }: { model: ModelConfig }) {
  return (
    <HoverCard.Root openDelay={300} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <CommandItem value={model.id}>
          <ProviderIcon provider={model.provider} />
          <span>{model.name}</span>
        </CommandItem>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content side="right" sideOffset={8} className="...">
          <h4>{model.name}</h4>
          <p>{model.description}</p>
          <div className="flex gap-2">
            {model.features.map(f => <FeatureBadge key={f} feature={f} />)}
          </div>
          <p className="text-muted-foreground">
            Knowledge cutoff: {model.knowledgeCutoff}
          </p>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
```

### Model Change Warning Message
```typescript
// Inline hint pattern for model switch mid-conversation
function ModelSwitchHint({ previousModel, currentModel }) {
  return (
    <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
      <Separator className="flex-1" />
      <span>Switched from {previousModel} to {currentModel}</span>
      <Separator className="flex-1" />
    </div>
  )
}
```

### Transport with Dynamic Model
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'

// Request-level body takes precedence over hook-level
const handleSend = async (text: string) => {
  await sendMessage(
    { text },
    {
      body: {
        model: selectedModel,
        threadId: currentThreadId
      }
    }
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Select dropdown | Command menu with search | 2024+ | Better UX for 8+ models |
| localStorage preferences | Server-side JSONB | Current best practice | Cross-device sync |
| Model per thread only | Model per message | AI SDK v5+ | Allows mid-conversation switching |
| Regex search | Fuse.js fuzzy search | Ongoing | Typo tolerance |

**Deprecated/outdated:**
- `useChat` v4 body option: Now use `DefaultChatTransport` with request-level body
- React context for model state: Simpler to lift state to ChatInterface component

## Open Questions

Things that couldn't be fully resolved:

1. **Provider Icon Assets**
   - What we know: Need small logos for OpenAI, Anthropic, Google
   - What's unclear: Whether to use SVG components, image files, or icon library
   - Recommendation: Create small SVG components in `components/icons/` for each provider

2. **System Default Model Choice**
   - What we know: Need a sensible fallback when user has no default set
   - What's unclear: Which model balances cost/quality for system default
   - Recommendation: Use `anthropic/claude-sonnet-4-20250514` (already `DEFAULT_MODEL` in codebase)

3. **Model Metadata Source of Truth**
   - What we know: Need descriptions, features, knowledge cutoffs for each model
   - What's unclear: Whether to hardcode or fetch from API
   - Recommendation: Extend `AVAILABLE_MODELS` array with static metadata for v1

## Sources

### Primary (HIGH confidence)
- Vercel AI SDK documentation - useChat transport, body options
- shadcn/ui Command component - API and composition patterns
- Radix UI Popover - Positioning, collision handling
- Radix UI HoverCard - Delay management, accessibility
- Fuse.js documentation - Options, keys, threshold configuration
- Existing codebase: `models.ts`, `schema.ts`, `chat/route.ts`, `chat-interface.tsx`

### Secondary (MEDIUM confidence)
- cmdk GitHub repository - Component API, filtering, keyboard handling
- Drizzle ORM JSONB documentation - $type inference, querying

### Tertiary (LOW confidence)
- t3.chat visual reference - Design patterns (no public documentation)
- AI chatbot UX trends 2026 - General direction, not specific implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs, already used in similar projects
- Architecture: HIGH - Patterns match existing codebase conventions and AI SDK docs
- Pitfalls: MEDIUM - Based on common React patterns, some inferred from design decisions

**Research date:** 2026-01-23
**Valid until:** 60 days (libraries are stable, patterns well-established)
