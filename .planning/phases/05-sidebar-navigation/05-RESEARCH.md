# Phase 5: Sidebar & Navigation - Research

**Researched:** 2026-01-23
**Domain:** Sidebar UI, thread list virtualization, date grouping, search, scroll preservation, mobile drawer
**Confidence:** HIGH

## Summary

This phase builds the sidebar UI that displays and organizes conversation history. The backend infrastructure exists from Phase 3 (thread router with list/pin/archive/rename operations) and Phase 4 (model picker, Fuse.js fuzzy search). The work focuses on presentation: collapsible sidebar layout, date grouping logic, virtualized thread list, search filtering, scroll position preservation, and mobile drawer behavior.

The codebase has strong foundations: `ThreadItem` and `ThreadContextMenu` components exist with hover actions and context menus, `useThreadActions` hook handles mutations with optimistic updates, Sheet component (Radix Dialog) is installed for mobile drawer, and Fuse.js is already a dependency from Phase 4.

The key technical challenges are:
1. **Virtualization** - TanStack Virtual for rendering potentially thousands of threads
2. **Date grouping** - Client-side grouping with memoization (Today/Yesterday/This Week/This Month/Older)
3. **Scroll preservation** - Store scroll position per-route in a ref or context
4. **Collapsible state** - Persist sidebar state in localStorage
5. **Keyboard shortcuts** - Cmd+N (new chat), Cmd+B (toggle sidebar), Cmd+K (focus search)

**Primary recommendation:** Use TanStack Virtual (`@tanstack/react-virtual`) for the thread list, implement date grouping as a client-side transform with `useMemo`, persist sidebar collapsed state in localStorage via a custom hook, and use the existing Sheet component for mobile drawer.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-virtual | 3.x | List virtualization | TanStack family, works with React 19, dynamic row heights |
| fuse.js | ^7.1.0 | Fuzzy search | Already installed from Phase 4, typo-tolerant |
| @radix-ui/react-dialog | ^1.1.15 | Mobile drawer (Sheet) | Already installed, accessibility built-in |
| lucide-react | ^0.562.0 | Icons | Already installed, consistent icon set |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-scroll-area | ^1.2.10 | Custom scrollbar styling | Already installed, sidebar scroll container |
| date-fns | (to install) | Date grouping helpers | isToday, isYesterday, isThisWeek, isThisMonth |
| cmdk | ^1.1.1 | Search keyboard nav | Already installed, Cmd+K pattern if desired |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Virtual | react-window | react-window is simpler but less flexible for dynamic heights |
| date-fns | dayjs | Both work; date-fns is more modular, tree-shakes well |
| localStorage | user preferences DB | localStorage is simpler for v1, syncs later if needed |
| Sheet (Dialog) | Custom drawer | Sheet has accessibility built-in, handles focus trap |

**Installation:**
```bash
pnpm add @tanstack/react-virtual date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── sidebar/
│       ├── sidebar.tsx              # Main sidebar container, collapse logic
│       ├── sidebar-header.tsx       # Logo, new chat button
│       ├── sidebar-search.tsx       # Search input with fuzzy filtering
│       ├── sidebar-thread-list.tsx  # Virtualized thread list with groups
│       ├── sidebar-thread-group.tsx # Date group header (Today, Yesterday, etc.)
│       ├── sidebar-footer.tsx       # User avatar + dropdown menu
│       ├── sidebar-collapsed.tsx    # Icon rail view when collapsed
│       └── sidebar-mobile.tsx       # Mobile drawer wrapper
│   └── thread/                      # Existing from Phase 3
│       ├── thread-item.tsx          # Already exists
│       ├── thread-context-menu.tsx  # Already exists
│       └── ...
├── hooks/
│   ├── use-sidebar-state.ts         # Collapse state + localStorage
│   ├── use-scroll-position.ts       # Preserve scroll per thread
│   ├── use-keyboard-shortcuts.ts    # Cmd+N, Cmd+B, Cmd+K handlers
│   └── use-thread-search.ts         # Fuzzy search with debounce
└── lib/
    └── date-grouping.ts             # Group threads by date buckets
```

### Pattern 1: Virtualized Thread List with TanStack Virtual
**What:** Render only visible threads for performance with large lists
**When to use:** Thread list could grow to hundreds/thousands
**Example:**
```typescript
// Source: TanStack Virtual docs
import { useVirtualizer } from "@tanstack/react-virtual";

function SidebarThreadList({ threads }: { threads: Thread[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: threads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{ height: virtualizer.getTotalSize(), position: "relative" }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ThreadItem thread={threads[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Pattern 2: Date Grouping with Memoization
**What:** Group threads into date buckets (Pinned/Today/Yesterday/This Week/This Month/Older)
**When to use:** Sidebar display with date headers
**Example:**
```typescript
// Source: date-fns docs + custom implementation
import { isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";

type DateGroup = "Pinned" | "Today" | "Yesterday" | "This Week" | "This Month" | "Older";

interface GroupedThreads {
  group: DateGroup;
  threads: Thread[];
}

function groupThreadsByDate(threads: Thread[]): GroupedThreads[] {
  const groups: Record<DateGroup, Thread[]> = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    "This Week": [],
    "This Month": [],
    Older: [],
  };

  for (const thread of threads) {
    if (thread.isPinned) {
      groups.Pinned.push(thread);
      continue; // Pinned threads don't appear in date groups
    }

    const date = new Date(thread.lastActivityAt);
    if (isToday(date)) {
      groups.Today.push(thread);
    } else if (isYesterday(date)) {
      groups.Yesterday.push(thread);
    } else if (isThisWeek(date)) {
      groups["This Week"].push(thread);
    } else if (isThisMonth(date)) {
      groups["This Month"].push(thread);
    } else {
      groups.Older.push(thread);
    }
  }

  // Return only non-empty groups
  return Object.entries(groups)
    .filter(([, threads]) => threads.length > 0)
    .map(([group, threads]) => ({ group: group as DateGroup, threads }));
}

// Usage with memoization
function useDateGroupedThreads(threads: Thread[]) {
  return useMemo(() => groupThreadsByDate(threads), [threads]);
}
```

### Pattern 3: Collapsible Sidebar with localStorage Persistence
**What:** Toggle sidebar between expanded and collapsed (icon rail) states
**When to use:** User preference that should persist across sessions
**Example:**
```typescript
// Source: React patterns + localStorage
function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  return { isCollapsed, toggle, setIsCollapsed };
}

// Keyboard shortcut integration
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      toggle();
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [toggle]);
```

### Pattern 4: Scroll Position Preservation
**What:** Remember scroll position when switching between threads
**When to use:** User expectation that sidebar position is maintained
**Example:**
```typescript
// Source: React patterns
function useScrollPosition(containerRef: RefObject<HTMLDivElement>) {
  const scrollPositionRef = useRef<number>(0);

  // Save position on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  // Restore position on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use requestAnimationFrame for reliable restoration after render
    requestAnimationFrame(() => {
      container.scrollTop = scrollPositionRef.current;
    });
  }, []); // Only on mount

  return scrollPositionRef;
}
```

### Pattern 5: Mobile Drawer with Sheet
**What:** Sidebar as slide-in drawer on mobile with overlay
**When to use:** Screen width below breakpoint (e.g., 768px)
**Example:**
```typescript
// Source: Existing Sheet component + responsive pattern
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@sidekiq/components/ui/sheet";
import { Menu } from "lucide-react";

function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        {/* Pass setOpen to close drawer on thread selection */}
        {React.cloneElement(children as React.ReactElement, {
          onThreadSelect: () => setOpen(false),
        })}
      </SheetContent>
    </Sheet>
  );
}
```

### Pattern 6: Fuzzy Search with Debounce
**What:** Filter threads by title with typo tolerance
**When to use:** Search input in sidebar
**Example:**
```typescript
// Source: Fuse.js docs + Phase 4 patterns
import Fuse from "fuse.js";

function useThreadSearch(threads: Thread[]) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const fuse = useMemo(
    () =>
      new Fuse(threads, {
        keys: ["title"],
        threshold: 0.4, // Allows typos
        ignoreLocation: true,
      }),
    [threads]
  );

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return threads;
    return fuse.search(debouncedQuery).map((result) => result.item);
  }, [fuse, debouncedQuery, threads]);

  return { query, setQuery, results, isSearching: query !== debouncedQuery };
}
```

### Anti-Patterns to Avoid
- **Rendering all threads without virtualization:** Will cause performance issues with 1000+ threads
- **Date grouping on every render:** Must memoize grouping logic
- **Storing scroll position in state:** Causes re-renders, use ref instead
- **Fetching threads on every navigation:** tRPC query caching handles this
- **Custom drawer without focus trap:** Use Radix Sheet for accessibility

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Virtualized list | Manual windowing | @tanstack/react-virtual | Handles dynamic heights, scroll position, measure |
| Date comparisons | Manual date math | date-fns isToday/isYesterday | Handles edge cases, timezones |
| Fuzzy search | Substring matching | Fuse.js | Typo tolerance, scoring, highlighting |
| Mobile drawer | Custom slide-in | Sheet (Radix Dialog) | Focus trap, backdrop, accessibility |
| Keyboard shortcuts | Manual event listeners | Central hook with cleanup | Avoids duplicate listeners, proper cleanup |
| Scroll container styling | Custom scrollbar CSS | Radix ScrollArea | Cross-browser, accessibility |

**Key insight:** The sidebar has complex interactions that are fully solved by the existing component library. TanStack Virtual handles the tricky virtualization math (measuring, scroll position, overscan). date-fns handles date edge cases. Fuse.js provides the search experience users expect. Building these from scratch leads to subtle bugs.

## Common Pitfalls

### Pitfall 1: Virtualization Breaks Date Group Headers
**What goes wrong:** Date headers (Today, Yesterday) get virtualized away, causing visual glitches
**Why it happens:** Treating headers and items as separate virtual rows with different heights
**How to avoid:**
- Flatten groups into a single array with type discriminator
- Each item is either `{ type: "header", group: string }` or `{ type: "thread", thread: Thread }`
- Use `measureElement` for dynamic heights (headers vs items)
**Warning signs:** Headers jumping, incorrect scroll position, layout shifts

### Pitfall 2: Search Clears When Navigating Between Threads
**What goes wrong:** User searches, clicks thread, search query disappears
**Why it happens:** Search state stored in component that remounts
**How to avoid:**
- Store search query in parent (layout) component or context
- Or use URL search params for search state
**Warning signs:** Users re-typing search after thread selection

### Pitfall 3: Scroll Position Lost on Thread Switch
**What goes wrong:** User scrolls down in sidebar, opens thread, sidebar resets to top
**Why it happens:** Scroll position not preserved across route changes
**How to avoid:**
- Store scroll position in ref at layout level
- Restore on mount using requestAnimationFrame
- Don't use state (causes unnecessary re-renders)
**Warning signs:** Users frustrated by losing position in long thread lists

### Pitfall 4: Collapsed Sidebar Loses Icons on Refresh
**What goes wrong:** Sidebar shows expanded but localStorage says collapsed
**Why it happens:** SSR/hydration mismatch with localStorage check
**How to avoid:**
- Use `useState` with lazy initializer that only runs on client
- Or check `typeof window !== "undefined"` before localStorage access
- Consider `useEffect` for initial localStorage read to avoid hydration issues
**Warning signs:** Flash of wrong sidebar state on page load

### Pitfall 5: Mobile Drawer Doesn't Close on Thread Select
**What goes wrong:** User taps thread in mobile drawer, drawer stays open
**Why it happens:** Sheet state not updated when thread is selected
**How to avoid:**
- Pass `onClose` callback to sidebar content
- Call `setOpen(false)` when thread is clicked
- Use router events or wrap ThreadItem click handler
**Warning signs:** Users manually closing drawer after every selection

### Pitfall 6: Relative Timestamps Not Updating
**What goes wrong:** "2 minutes ago" stays static as time passes
**Why it happens:** Timestamp computed once on render, not updated
**How to avoid:**
- For v1: Accept static timestamps (recalculated on re-fetch)
- For v2: Use `setInterval` to refresh timestamps every minute
- Or use a timestamp library like timeago-react
**Warning signs:** "5 minutes ago" still showing after 30 minutes

## Code Examples

Verified patterns from official sources:

### TanStack Virtual with Groups (Flattened)
```typescript
// Source: TanStack Virtual docs + custom pattern
type VirtualItem =
  | { type: "header"; group: DateGroup }
  | { type: "thread"; thread: Thread };

function flattenGroupsForVirtualization(
  groups: GroupedThreads[]
): VirtualItem[] {
  const items: VirtualItem[] = [];
  for (const { group, threads } of groups) {
    items.push({ type: "header", group });
    for (const thread of threads) {
      items.push({ type: "thread", thread });
    }
  }
  return items;
}

// In component
const virtualItems = useMemo(
  () => flattenGroupsForVirtualization(groupedThreads),
  [groupedThreads]
);

const virtualizer = useVirtualizer({
  count: virtualItems.length,
  getScrollElement: () => parentRef.current,
  estimateSize: (index) =>
    virtualItems[index].type === "header" ? 32 : 48, // Headers shorter
  overscan: 5,
});
```

### Keyboard Shortcuts Hook
```typescript
// Source: React patterns
interface ShortcutHandlers {
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onFocusSearch?: () => void;
}

function useKeyboardShortcuts({
  onNewChat,
  onToggleSidebar,
  onFocusSearch,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === "n") {
        e.preventDefault();
        onNewChat?.();
      } else if (isMod && e.key === "b") {
        e.preventDefault();
        onToggleSidebar?.();
      } else if (isMod && e.key === "k") {
        e.preventDefault();
        onFocusSearch?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewChat, onToggleSidebar, onFocusSearch]);
}
```

### Relative Timestamp Display
```typescript
// Source: date-fns docs
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";

function formatThreadTimestamp(date: Date): string {
  if (isToday(date)) {
    // "2h ago" for today
    return formatDistanceToNow(date, { addSuffix: true });
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    // "Jan 15" for older
    return format(date, "MMM d");
  }
}
```

### Sidekiq Thread Indicator
```typescript
// Source: CONTEXT.md decisions
interface ThreadWithSidekiq extends Thread {
  sidekiq?: {
    id: string;
    name: string;
  } | null;
}

function ThreadItemContent({ thread }: { thread: ThreadWithSidekiq }) {
  return (
    <div className="min-w-0 flex-1">
      <span className="block truncate text-sm">
        {thread.title ?? "New conversation"}
      </span>
      {thread.sidekiq && (
        <span className="text-muted-foreground block truncate text-xs">
          with {thread.sidekiq.name}
        </span>
      )}
    </div>
  );
}

// Avatar for Sidekiq thread (initial in colored circle)
function SidekiqAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  // Generate consistent color from name
  const hue = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
    >
      {initial}
    </div>
  );
}
```

### Layout with Responsive Sidebar
```typescript
// Source: Next.js App Router patterns
// app/(dashboard)/chat/layout.tsx

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex h-screen">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* Header with mobile menu */}
          <header className="border-border/50 flex h-14 shrink-0 items-center border-b px-4">
            {/* Mobile sidebar trigger */}
            <MobileSidebar>
              <Sidebar />
            </MobileSidebar>

            {/* Rest of header */}
          </header>

          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-virtualized | @tanstack/react-virtual | 2023+ | Smaller bundle, hooks-based, better DX |
| moment.js | date-fns | 2020+ | Tree-shakeable, immutable, smaller |
| Custom drawer | Radix Dialog/Sheet | 2022+ | Accessibility handled, composable |
| CSS position: sticky | Virtualized group headers | Current | Better performance with large lists |
| localStorage direct | Custom hook with hydration | Current | Avoids SSR/hydration mismatch |

**Deprecated/outdated:**
- react-virtualized (large bundle, class components)
- moment.js (large, mutable, legacy)
- CSS overflow: scroll without contain: strict (causes layout thrashing in virtualization)

## Open Questions

Things that couldn't be fully resolved:

1. **Sidebar Exact Width**
   - What we know: Per CONTEXT.md, exact width is Claude's discretion
   - Recommendation: 280px expanded, 64px collapsed (matches Linear/Notion patterns)

2. **Animation Timing for Collapse**
   - What we know: Per CONTEXT.md, animation timing is Claude's discretion
   - Recommendation: 200ms ease-out for collapse, CSS transition on width

3. **Search Empty State Copy**
   - What we know: "No threads found" per CONTEXT.md
   - What's unclear: Whether to show suggestion to create new chat
   - Recommendation: "No conversations found" with subtle "Start a new chat" link

4. **Thread Item Truncation Length**
   - What we know: Per CONTEXT.md, ~25-30 chars then ellipsis
   - What's unclear: Whether to use CSS truncate or JS slice
   - Recommendation: CSS truncate with max-width, more flexible

5. **Sidekiq Data Loading for Thread List**
   - What we know: Need sidekiq name for subtitle display
   - What's unclear: Whether to join in thread.list or lazy load
   - Recommendation: Include minimal sidekiq data (name only) in thread.list query via Drizzle `with` clause

## Sources

### Primary (HIGH confidence)
- TanStack Virtual documentation - useVirtualizer hook, dynamic heights, scroll position
- date-fns documentation - isToday, isYesterday, isThisWeek, formatDistanceToNow
- Fuse.js documentation - threshold, ignoreLocation, keys configuration
- Radix UI Dialog/Sheet - Mobile drawer pattern, accessibility
- Existing codebase: ThreadItem, ThreadContextMenu, useThreadActions, Sheet component

### Secondary (MEDIUM confidence)
- Linear app - Sidebar collapse/expand pattern, icon rail design
- Notion app - Date grouping visual patterns
- shadcn/ui sidebar examples - Layout patterns

### Tertiary (LOW confidence)
- General UX patterns for chat sidebars (ChatGPT, Claude desktop)
- Community virtualization patterns with groups

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - TanStack Virtual is well-documented, date-fns is established, all other libs already in project
- Architecture: HIGH - Patterns verified against official docs and existing codebase conventions
- Pitfalls: HIGH - Based on common virtualization issues and React patterns for state persistence

**Research date:** 2026-01-23
**Valid until:** 2026-02-22 (30 days - stable domain, established patterns)
