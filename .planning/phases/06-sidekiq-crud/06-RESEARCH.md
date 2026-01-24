# Phase 6: Sidekiq CRUD - Research

**Researched:** 2026-01-24
**Domain:** CRUD operations for custom AI assistants with form editor, avatar system, tagging, and list views
**Confidence:** HIGH

## Summary

This phase implements full CRUD functionality for Sidekiqs (custom AI assistants). The existing codebase provides strong foundations: React Hook Form with Zod resolver for forms, tRPC with protected procedures for API, Drizzle ORM with existing `sidekiqs` table schema, and shadcn/ui components. The main technical work involves building a split-pane form editor (left: form, right: preview), a markdown editor for instructions, drag-and-drop reorderable conversation starters, an avatar system with initials/emoji, and list/grid views with filtering and sorting.

The CONTEXT.md defines extensive UI decisions: full-page routes for create/edit, split layout like OpenAI GPTs editor, rich markdown with preview toggle, user-defined tags, hybrid list/grid views, and type-to-confirm deletion. The schema needs extension for: conversation starters (JSONB array), default model, avatar config (color + emoji/initials), favorited status, tags (new junction table), and usage stats.

The phase requires three new libraries: `@dnd-kit/sortable` for reorderable lists (react-beautiful-dnd is deprecated), `frimousse` for emoji picker (integrates with shadcn/ui), and `@uiw/react-md-editor` for markdown editing with preview. Rate limiting uses `@trpc-limiter/memory` for anti-spam protection on create mutations.

**Primary recommendation:** Build a tRPC `sidekiq` router with CRUD mutations, extend schema with conversation starters/avatar/tags fields, use @dnd-kit/sortable for drag-drop, frimousse for emoji picker, and @uiw/react-md-editor for instructions editing. Add rate limiting middleware for create mutations.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.71.1 | Form state management | Already used in auth forms, provides validation integration |
| @hookform/resolvers | ^5.2.2 | Zod integration for RHF | Already installed, enables schema-based validation |
| zod | ^3.24.2 | Schema validation | Already used throughout, type inference for forms |
| tRPC | ^11.0.0 | Type-safe API layer | protectedProcedure available, existing router patterns |
| drizzle-orm | ^0.41.0 | Database operations | Schema has sidekiqs table, relations defined |
| @tanstack/react-query | ^5.69.0 | Server state, mutations | Integrated with tRPC, optimistic update patterns |
| nanoid | ^5.1.6 | ID generation | Already used for thread/message IDs |
| sonner | ^2.0.7 | Toast notifications | Already used for feedback |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-toggle-group | installed | Grid/list view toggle | Sidebar view preference toggle |
| @radix-ui/react-alert-dialog | installed | Delete confirmation | Type-to-confirm delete dialog |
| @radix-ui/react-context-menu | installed | Quick actions | Right-click Sidekiq actions |
| @radix-ui/react-avatar | installed | Avatar container | Initials/emoji avatar display |
| @radix-ui/react-popover | installed | Color/emoji picker container | Avatar customization popover |
| fuse.js | ^7.1.0 | Fuzzy search | Search sidekiqs by name/description |
| date-fns | ^4.1.0 | Date formatting | "Last used 2 days ago" display |

### New Libraries Required
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| @dnd-kit/core | ^6.3.1 | Drag-drop foundation | Modern replacement for deprecated react-beautiful-dnd |
| @dnd-kit/sortable | ^10.0.0 | Sortable list preset | Conversation starters reordering |
| @dnd-kit/utilities | ^3.2.2 | Helper utilities | CSS transform utilities |
| frimousse | ^0.3.0 | Emoji picker | Lightweight, unstyled, shadcn/ui integration via CLI |
| @uiw/react-md-editor | ^4.0.4 | Markdown editor | Textarea-based, preview toggle, dark mode support |
| @trpc-limiter/memory | ^1.0.0 | Rate limiting | In-memory rate limiting for create mutations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | hello-pangea/dnd | hello-pangea is react-beautiful-dnd fork - less flexible but simpler API |
| @uiw/react-md-editor | MDXEditor | MDXEditor is heavier, WYSIWYG - md-editor is simpler textarea approach |
| frimousse | emoji-mart | emoji-mart is heavier, more features; frimousse is minimal + shadcn integration |
| @trpc-limiter/memory | @trpc-limiter/upstash | Upstash for production scale; memory sufficient for MVP |

**Installation:**
```bash
# Core new dependencies
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities frimousse @uiw/react-md-editor @trpc-limiter/memory

# shadcn/ui components needed
pnpm dlx shadcn@latest add breadcrumb
pnpm dlx shadcn@latest add https://frimousse.liveblocks.io/r/emoji-picker
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── server/api/routers/
│   └── sidekiq.ts              # Sidekiq tRPC router with CRUD + rate limiting
├── lib/validations/
│   └── sidekiq.ts              # Zod schemas for sidekiq operations
├── lib/utils/
│   └── avatar.ts               # Color hash generation, initials extraction
├── components/sidekiq/
│   ├── sidekiq-form.tsx        # Main create/edit form component
│   ├── sidekiq-preview.tsx     # Live preview panel (right side)
│   ├── sidekiq-list.tsx        # Grid/list view container
│   ├── sidekiq-card.tsx        # Card view item
│   ├── sidekiq-row.tsx         # Table row view item
│   ├── sidekiq-avatar.tsx      # Avatar with initials/emoji + color
│   ├── sidekiq-context-menu.tsx # Right-click actions
│   ├── delete-sidekiq-dialog.tsx # Type-to-confirm deletion
│   ├── conversation-starters.tsx # Drag-drop reorderable list
│   ├── emoji-picker-popover.tsx  # Emoji selection for avatar
│   ├── color-picker-popover.tsx  # Color selection for avatar
│   └── tag-selector.tsx          # Tag picker with inline create
├── components/sidebar/
│   └── sidebar-sidekiqs.tsx    # Sidebar section for sidekiqs
├── hooks/
│   ├── use-sidekiq-actions.ts  # Mutation hooks with optimistic updates
│   └── use-view-preference.ts  # localStorage for grid/list toggle
└── app/(dashboard)/
    └── sidekiqs/
        ├── page.tsx            # /sidekiqs - list view
        ├── new/
        │   └── page.tsx        # /sidekiqs/new - create form
        └── [id]/
            └── edit/
                └── page.tsx    # /sidekiqs/[id]/edit - edit form
```

### Pattern 1: React Hook Form with Zod Validation
**What:** Form state management with schema-based validation
**When to use:** All Sidekiq create/edit forms
**Example:**
```typescript
// Source: Existing project pattern (sign-up-form.tsx)
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const sidekiqFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  instructions: z.string().max(8000, "Instructions too long"),
  conversationStarters: z.array(
    z.string().max(200, "Starter too long")
  ).max(6, "Maximum 6 starters"),
  defaultModel: z.string().optional(),
  avatar: z.object({
    type: z.enum(["initials", "emoji"]),
    color: z.string(),
    emoji: z.string().optional(),
  }),
  tags: z.array(z.string()).optional(),
});

type SidekiqFormValues = z.infer<typeof sidekiqFormSchema>;

function SidekiqForm({ initialData }: Props) {
  const form = useForm<SidekiqFormValues>({
    resolver: zodResolver(sidekiqFormSchema),
    defaultValues: initialData ?? {
      name: "",
      description: "",
      instructions: "",
      conversationStarters: [],
      avatar: { type: "initials", color: "#6366f1" },
      tags: [],
    },
    mode: "onChange", // Per CONTEXT.md: inline validation as user types
  });
}
```

### Pattern 2: @dnd-kit Sortable List for Conversation Starters
**What:** Drag-and-drop reorderable list with keyboard accessibility
**When to use:** Conversation starters editor in Sidekiq form
**Example:**
```typescript
// Source: @dnd-kit/sortable official docs
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function ConversationStarters({ value, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((s) => s.id === active.id);
      const newIndex = value.findIndex((s) => s.id === over.id);
      onChange(arrayMove(value, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={value} strategy={verticalListSortingStrategy}>
        {value.map((starter) => (
          <SortableItem key={starter.id} id={starter.id} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
```

### Pattern 3: Rate Limiting Middleware for tRPC
**What:** Throttle create mutations to prevent spam
**When to use:** Sidekiq create mutation
**Example:**
```typescript
// Source: trpc-limiter official docs
import { createTRPCStoreLimiter } from "@trpc-limiter/memory";
import { TRPCError } from "@trpc/server";

const rateLimiter = createTRPCStoreLimiter({
  max: 25, // 25 creations per hour (CONTEXT.md: 20-30)
  windowMs: 60 * 60 * 1000, // 1 hour window
  fingerprint: (ctx) => ctx.session?.user?.id ?? "anonymous",
});

const rateLimitedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const result = await rateLimiter.check(ctx);
  if (!result.success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${Math.ceil(result.retryAfter / 60)} minutes.`,
    });
  }
  return next({ ctx: { ...ctx, rateLimit: result } });
});

export const sidekiqRouter = createTRPCRouter({
  create: rateLimitedProcedure
    .input(createSidekiqSchema)
    .mutation(async ({ ctx, input }) => {
      // ... create logic
    }),
});
```

### Pattern 4: Avatar Color Generation from Name Hash
**What:** Deterministic color from name for consistent avatar backgrounds
**When to use:** Auto-generating avatar color when creating Sidekiq
**Example:**
```typescript
// Source: Standard color hashing approach
const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
] as const;

export function generateColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
```

### Pattern 5: Unsaved Changes Detection with beforeunload
**What:** Warn user when navigating away with unsaved changes
**When to use:** Sidekiq create/edit form
**Example:**
```typescript
// Source: Next.js + React patterns
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";

function useSaveGuard(isDirty: boolean) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Browser beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Intercept navigation
  const safeNavigate = useCallback((path: string) => {
    if (isDirty) {
      setPendingNavigation(path);
      setShowDialog(true);
    } else {
      router.push(path);
    }
  }, [isDirty, router]);

  const confirmDiscard = useCallback(() => {
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    setShowDialog(false);
  }, [pendingNavigation, router]);

  return { showDialog, setShowDialog, safeNavigate, confirmDiscard };
}
```

### Anti-Patterns to Avoid
- **Rich text editor for instructions:** Per CONTEXT.md, use markdown editor with preview toggle, not WYSIWYG
- **Storing images in database:** Avatar images are deferred; use only initials/emoji for MVP
- **Unlimited conversation starters:** Limit to 4-6 for UX; max 200 chars each
- **Syncing URL state for forms:** Use localStorage for draft autosave, not URL params
- **Rate limiting in middleware.ts:** Use tRPC middleware for fine-grained procedure-level control

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop reorder | Custom mouse/touch handlers | @dnd-kit/sortable | Keyboard accessibility, collision detection, animations |
| Emoji picker | Custom emoji grid | frimousse (shadcn/ui CLI) | Virtualization, search, recent emojis, keyboard nav |
| Markdown preview | dangerouslySetInnerHTML | @uiw/react-md-editor | XSS protection, syntax highlighting, toggle mode |
| Rate limiting | Custom Map + timestamps | @trpc-limiter | Sliding window, cleanup, fingerprinting |
| Color picker | Custom 12-color grid | Radix Popover + preset buttons | Focus management, accessibility |
| Form validation | Manual error checks | react-hook-form + zod | Type inference, async validation, field arrays |
| Type-to-confirm deletion | Custom input matching | AlertDialog + controlled input | Focus trap, keyboard handling |

**Key insight:** The three complex features (drag-drop, emoji picker, markdown) each have well-maintained libraries. Building custom versions would take weeks and miss edge cases (accessibility, mobile touch, keyboard navigation). The @dnd-kit, frimousse, and react-md-editor libraries are lightweight and composable.

## Common Pitfalls

### Pitfall 1: Unique Name Validation Without Server Check
**What goes wrong:** Two users can create Sidekiqs with same name; or same user creates duplicates
**Why it happens:** Only checking client-side, not validating uniqueness on server
**How to avoid:**
- Add unique index on (ownerId, LOWER(name)) in database
- Check uniqueness in create/update mutation before insert
- Return specific error code for duplicate name (not generic validation error)
**Warning signs:** Constraint violation errors in production, confusing duplicate entries

### Pitfall 2: Markdown XSS Without Sanitization
**What goes wrong:** User embeds `<script>` or event handlers in instructions
**Why it happens:** Rendering markdown HTML directly without sanitization
**How to avoid:**
- @uiw/react-md-editor handles preview sanitization internally
- For custom rendering, use rehype-sanitize or DOMPurify
- Never use dangerouslySetInnerHTML with raw markdown output
**Warning signs:** Security scanner warnings, injected content appearing

### Pitfall 3: Conversation Starters Array Mutation
**What goes wrong:** Reorder doesn't update form state; items duplicate or disappear
**Why it happens:** Mutating array in place instead of creating new array
**How to avoid:**
- Always use `arrayMove` from @dnd-kit which returns new array
- Use `form.setValue("conversationStarters", newArray)` not push/splice
- Pass `{ shouldDirty: true }` to trigger form dirty state
**Warning signs:** Drag-drop works visually but save doesn't include reorder

### Pitfall 4: Rate Limit Error Not Surfaced in UI
**What goes wrong:** User clicks create, nothing happens, no feedback
**Why it happens:** tRPC error not caught and displayed to user
**How to avoid:**
- Check for `TRPCError.code === "TOO_MANY_REQUESTS"` in onError
- Show remaining time in toast: "Please wait X minutes"
- Per CONTEXT.md: disable button with tooltip showing remaining time
**Warning signs:** Silent failures, user clicking button multiple times

### Pitfall 5: Delete Without Thread Association Prompt
**What goes wrong:** User deletes Sidekiq, associated threads lose their sidekiqId reference silently
**Why it happens:** Schema has `onDelete: "set null"` but no user confirmation
**How to avoid:**
- Per CONTEXT.md: prompt "Keep conversations or delete them?"
- Count threads with this sidekiqId before showing delete dialog
- Offer checkbox/toggle in delete dialog for cascade vs preserve
**Warning signs:** Threads showing as "Unknown Assistant" after delete

### Pitfall 6: View Preference Lost on Refresh
**What goes wrong:** User selects grid view, refreshes, back to default list view
**Why it happens:** Preference stored only in React state
**How to avoid:**
- Store in localStorage with key like `sidekiq-view-preference`
- Initialize state from localStorage on mount
- Update localStorage on change
**Warning signs:** User frustration, repeated view toggle clicks

## Code Examples

Verified patterns from official sources:

### Sidekiq tRPC Router
```typescript
// Source: Existing threadRouter pattern + Context7 tRPC docs
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createTRPCRouter, protectedProcedure } from "@sidekiq/server/api/trpc";
import { sidekiqs, threads } from "@sidekiq/server/db/schema";
import {
  createSidekiqSchema,
  updateSidekiqSchema,
  deleteSidekiqSchema,
} from "@sidekiq/lib/validations/sidekiq";

export const sidekiqRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.sidekiqs.findMany({
      where: eq(sidekiqs.ownerId, ctx.session.user.id),
      orderBy: [desc(sidekiqs.isFavorite), desc(sidekiqs.lastUsedAt)],
      columns: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        isFavorite: true,
        lastUsedAt: true,
        threadCount: true,
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sidekiq = await ctx.db.query.sidekiqs.findFirst({
        where: and(
          eq(sidekiqs.id, input.id),
          eq(sidekiqs.ownerId, ctx.session.user.id)
        ),
      });
      if (!sidekiq) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return sidekiq;
    }),

  create: protectedProcedure // Add rate limiting middleware here
    .input(createSidekiqSchema)
    .mutation(async ({ ctx, input }) => {
      // Check name uniqueness (case-insensitive)
      const existing = await ctx.db.query.sidekiqs.findFirst({
        where: and(
          eq(sidekiqs.ownerId, ctx.session.user.id),
          sql`LOWER(${sidekiqs.name}) = LOWER(${input.name})`
        ),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A Sidekiq with this name already exists",
        });
      }

      const [created] = await ctx.db
        .insert(sidekiqs)
        .values({
          id: nanoid(),
          ownerId: ctx.session.user.id,
          ...input,
        })
        .returning();

      return created;
    }),

  update: protectedProcedure
    .input(updateSidekiqSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check name uniqueness if name changed
      if (data.name) {
        const existing = await ctx.db.query.sidekiqs.findFirst({
          where: and(
            eq(sidekiqs.ownerId, ctx.session.user.id),
            sql`LOWER(${sidekiqs.name}) = LOWER(${data.name})`,
            sql`${sidekiqs.id} != ${id}`
          ),
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A Sidekiq with this name already exists",
          });
        }
      }

      const [updated] = await ctx.db
        .update(sidekiqs)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(sidekiqs.id, id), eq(sidekiqs.ownerId, ctx.session.user.id))
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return updated;
    }),

  delete: protectedProcedure
    .input(deleteSidekiqSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, deleteThreads } = input;

      // If user wants to delete threads too
      if (deleteThreads) {
        await ctx.db
          .delete(threads)
          .where(
            and(
              eq(threads.sidekiqId, id),
              eq(threads.userId, ctx.session.user.id)
            )
          );
      }

      const [deleted] = await ctx.db
        .delete(sidekiqs)
        .where(
          and(eq(sidekiqs.id, id), eq(sidekiqs.ownerId, ctx.session.user.id))
        )
        .returning({ id: sidekiqs.id });

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return { success: true, deletedId: deleted.id };
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sidekiq = await ctx.db.query.sidekiqs.findFirst({
        where: and(
          eq(sidekiqs.id, input.id),
          eq(sidekiqs.ownerId, ctx.session.user.id)
        ),
        columns: { isFavorite: true },
      });

      if (!sidekiq) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updated] = await ctx.db
        .update(sidekiqs)
        .set({ isFavorite: !sidekiq.isFavorite, updatedAt: new Date() })
        .where(
          and(eq(sidekiqs.id, input.id), eq(sidekiqs.ownerId, ctx.session.user.id))
        )
        .returning({ id: sidekiqs.id, isFavorite: sidekiqs.isFavorite });

      return updated;
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.db.query.sidekiqs.findFirst({
        where: and(
          eq(sidekiqs.id, input.id),
          eq(sidekiqs.ownerId, ctx.session.user.id)
        ),
      });

      if (!original) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Generate unique name: "Copy of [Name]" or "Copy of [Name] (2)" etc.
      let copyName = `Copy of ${original.name}`;
      let counter = 1;
      while (true) {
        const exists = await ctx.db.query.sidekiqs.findFirst({
          where: and(
            eq(sidekiqs.ownerId, ctx.session.user.id),
            sql`LOWER(${sidekiqs.name}) = LOWER(${copyName})`
          ),
        });
        if (!exists) break;
        counter++;
        copyName = `Copy of ${original.name} (${counter})`;
      }

      const [created] = await ctx.db
        .insert(sidekiqs)
        .values({
          id: nanoid(),
          ownerId: ctx.session.user.id,
          name: copyName,
          description: original.description,
          instructions: original.instructions,
          conversationStarters: original.conversationStarters,
          defaultModel: original.defaultModel,
          avatar: original.avatar,
          isFavorite: false,
          threadCount: 0,
          lastUsedAt: null,
        })
        .returning();

      return created;
    }),
});
```

### Sidekiq Avatar Component
```typescript
// Source: Existing avatar.tsx + custom logic
import { Avatar, AvatarFallback } from "@sidekiq/components/ui/avatar";
import { cn } from "@sidekiq/lib/utils";

interface SidekiqAvatarProps {
  name: string;
  avatar: {
    type: "initials" | "emoji";
    color: string;
    emoji?: string;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

export function SidekiqAvatar({
  name,
  avatar,
  size = "md",
  className,
}: SidekiqAvatarProps) {
  const initials = getInitials(name);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback
        style={{ backgroundColor: avatar.color }}
        className="text-white font-semibold"
      >
        {avatar.type === "emoji" ? avatar.emoji : initials}
      </AvatarFallback>
    </Avatar>
  );
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
```

### Markdown Editor Integration
```typescript
// Source: @uiw/react-md-editor docs + Next.js dynamic import
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Dynamic import to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface InstructionsEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function InstructionsEditor({
  value,
  onChange,
  maxLength = 8000,
}: InstructionsEditorProps) {
  const [preview, setPreview] = useState<"edit" | "preview">("edit");

  return (
    <div className="space-y-2" data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? "")}
        preview={preview}
        hideToolbar={false}
        height={300}
        textareaProps={{
          placeholder: "Enter system instructions for your Sidekiq...",
          maxLength,
        }}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => setPreview(preview === "edit" ? "preview" : "edit")}
          className="hover:underline"
        >
          {preview === "edit" ? "Show preview" : "Hide preview"}
        </button>
        <span className={cn(
          value.length > maxLength * 0.9 && "text-amber-500",
          value.length >= maxLength && "text-destructive"
        )}>
          {value.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}
```

### Type-to-Confirm Delete Dialog
```typescript
// Source: Existing delete-thread-dialog.tsx + CONTEXT.md requirement
"use client";

import { useState } from "react";
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
import { Input } from "@sidekiq/components/ui/input";
import { Label } from "@sidekiq/components/ui/label";
import { Checkbox } from "@sidekiq/components/ui/checkbox";

interface DeleteSidekiqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (deleteThreads: boolean) => void;
  sidekiqName: string;
  threadCount: number;
  isDeleting?: boolean;
}

export function DeleteSidekiqDialog({
  open,
  onOpenChange,
  onConfirm,
  sidekiqName,
  threadCount,
  isDeleting = false,
}: DeleteSidekiqDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [deleteThreads, setDeleteThreads] = useState(false);

  const isConfirmed = confirmText === sidekiqName;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmText("");
      setDeleteThreads(false);
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{sidekiqName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Type the Sidekiq name to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Type <span className="font-mono font-semibold">{sidekiqName}</span> to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={sidekiqName}
              disabled={isDeleting}
            />
          </div>

          {threadCount > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delete-threads"
                checked={deleteThreads}
                onCheckedChange={(checked) => setDeleteThreads(checked === true)}
                disabled={isDeleting}
              />
              <Label htmlFor="delete-threads" className="text-sm text-muted-foreground">
                Also delete {threadCount} conversation{threadCount > 1 ? "s" : ""} using this Sidekiq
              </Label>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(deleteThreads)}
            disabled={!isConfirmed || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Sidekiq"}
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
| react-beautiful-dnd | @dnd-kit | 2022 (deprecated) | More flexible, maintained, better accessibility |
| Custom emoji grid | frimousse/emoji-mart | 2024+ | Virtualization, proper emoji data, accessibility |
| Manual rate limiting | @trpc-limiter | 2023 | Proper sliding window, fingerprinting, cleanup |
| useState for URL state | nuqs (optional) | 2024 | Type-safe URL params, SSR support |
| Separate form + preview | Split pane layout | Current | Better UX for complex forms (GPTs editor pattern) |

**Deprecated/outdated:**
- react-beautiful-dnd: Officially deprecated by Atlassian in 2022, use @dnd-kit or hello-pangea/dnd
- emoji-picker-react v3: v4 has breaking changes, check docs for migration
- react-markdown without sanitization: Must use rehype-sanitize for user content

## Open Questions

Things that couldn't be fully resolved:

1. **Draft autosave behavior**
   - What we know: Per CONTEXT.md this is Claude's discretion
   - What's unclear: localStorage vs database draft storage
   - Recommendation: Use localStorage with 30-second debounce; show "Draft saved" indicator. Clear on successful submit.

2. **Test chat persistence in preview**
   - What we know: Per CONTEXT.md this is Claude's discretion
   - What's unclear: Whether test messages persist across edit sessions
   - Recommendation: Keep ephemeral (in React state only) - simpler, no database overhead. Clear on page leave.

3. **Post-create redirect destination**
   - What we know: Per CONTEXT.md this is Claude's discretion
   - What's unclear: Go to list, go to edit, or start chat
   - Recommendation: Redirect to edit page with success toast. User can then test or go to list.

4. **Tag limits**
   - What we know: Per CONTEXT.md this is Claude's discretion
   - What's unclear: Max tags per Sidekiq, max total tags per user
   - Recommendation: 5 tags per Sidekiq, 50 total tags per user. Provide create-inline in selector.

5. **Character count display**
   - What we know: Per CONTEXT.md options are always, near limit, or on focus
   - Recommendation: Show always for instructions (important limit), show near limit (80%+) for name/description.

## Sources

### Primary (HIGH confidence)
- Context7 react-hook-form - Form patterns, field arrays, resolver integration
- Context7 @dnd-kit - Sortable lists, sensors, drag-end handling
- GitHub frimousse v0.3.0 - Emoji picker API, shadcn/ui CLI installation
- GitHub @uiw/react-md-editor - Markdown editor with preview, SSR handling
- GitHub @trpc-limiter - Rate limiting middleware for tRPC

### Secondary (MEDIUM confidence)
- shadcn/ui documentation - Breadcrumb, ToggleGroup, AlertDialog components
- WebSearch: nuqs URL state management - Verified against GitHub and npm

### Tertiary (LOW confidence)
- WebSearch: Rate limiting best practices - General patterns, specific implementation varies
- WebSearch: GPTs editor layout pattern - Visual reference, no specific code patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries already in project, patterns verified
- Architecture: HIGH - Follows existing project patterns, new libraries verified with official docs
- Pitfalls: HIGH - Based on common React Hook Form, drag-drop, and validation issues

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, established patterns)
