"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MessageSquare, Search } from "lucide-react";
import Fuse, { type FuseResult } from "fuse.js";
import type { ReactNode } from "react";

import { api } from "@sidekiq/shared/trpc/react";
import { useScrollPosition } from "@sidekiq/hooks/use-scroll-position";
import {
  groupThreadsByDate,
  type DateGroup,
  type Thread,
  type GroupedThreads,
} from "@sidekiq/shared/lib/date-grouping";
import { ThreadItem } from "@sidekiq/components/thread/thread-item";
import { SidebarThreadGroup } from "./sidebar-thread-group";
import { Skeleton } from "@sidekiq/components/ui/skeleton";

/**
 * Virtual item type for flattened groups.
 * Either a date group header, a thread item, or a search result with highlighting.
 *
 * Thread items include sidekiq relation data (id, name, avatar) when the thread
 * is associated with a Sidekiq, enabling visual indicators in ThreadItem.
 */
type VirtualItem =
  | { type: "header"; group: DateGroup }
  | { type: "thread"; thread: Thread; highlightedTitle?: ReactNode };

/**
 * Flattens grouped threads into a single array for virtualization.
 * Each group becomes a header item followed by its threads.
 *
 * @param groups - Array of grouped threads
 * @returns Flattened array of virtual items
 */
function flattenGroupsForVirtualization(
  groups: GroupedThreads[],
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

interface SidebarThreadListProps {
  /** Search query for filtering threads by title */
  searchQuery?: string;
  /** Callback when a thread is selected (used by mobile drawer to close) */
  onThreadSelect?: () => void;
}

/**
 * Virtualized thread list with date grouping and search.
 *
 * Features:
 * - TanStack Virtual for performance with large thread lists
 * - Date grouping (Pinned, Today, Yesterday, This Week, This Month, Older)
 * - Fuzzy search with typo tolerance and match highlighting
 * - Flat list during search (no date grouping)
 * - Scroll position preservation when switching threads
 * - Active thread highlighting via pathname
 * - Empty, loading, and no-results states
 *
 * @param props.searchQuery - Search query for filtering threads
 * @param props.onThreadSelect - Callback when a thread is selected
 *
 * @example
 * ```tsx
 * <SidebarThreadList />
 * // Or with search and callback:
 * <SidebarThreadList searchQuery={searchQuery} onThreadSelect={() => setOpen(false)} />
 * ```
 */
export function SidebarThreadList({
  searchQuery,
  onThreadSelect,
}: SidebarThreadListProps) {
  const pathname = usePathname();
  const parentRef = useRef<HTMLDivElement>(null);

  // Preserve scroll position when switching threads
  useScrollPosition(parentRef);

  // Get active thread ID from pathname
  const activeThreadId = pathname?.startsWith("/chat/")
    ? (pathname.split("/")[2] ?? null)
    : null;

  // Fetch threads (already filters out archived by default)
  const threadsQuery = api.thread.list.useQuery();
  const threads = useMemo(() => threadsQuery.data ?? [], [threadsQuery.data]);

  // Debounce search query (200ms)
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery ?? "");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery ?? ""), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Create Fuse instance (memoized)
  const fuse = useMemo(
    () =>
      new Fuse(threads, {
        keys: ["title"],
        threshold: 0.4, // Per Phase 4 pattern - allows typos
        ignoreLocation: true,
        includeMatches: true, // For highlighting
      }),
    [threads],
  );

  // Get search results
  const searchResults = useMemo((): FuseResult<Thread>[] | null => {
    if (!debouncedQuery.trim()) return null; // null = no search active
    return fuse.search(debouncedQuery);
  }, [fuse, debouncedQuery]);

  const filteredThreads = useMemo(() => {
    if (searchResults === null) return threads;
    return searchResults.map((result) => result.item);
  }, [searchResults, threads]);

  // Highlight matching text in title
  const highlightMatch = useCallback(
    (text: string): ReactNode => {
      if (!debouncedQuery.trim() || !text) return text;

      // Find the matching result to get match indices
      const matchResult = searchResults?.find((r) => r.item.title === text);
      if (!matchResult?.matches?.[0]?.indices) return text;

      const indices = matchResult.matches[0].indices;
      const parts: ReactNode[] = [];
      let lastIndex = 0;

      indices.forEach(([start, end], i) => {
        // Add non-matching text before this match
        if (start > lastIndex) {
          parts.push(text.slice(lastIndex, start));
        }
        // Add highlighted match
        parts.push(
          <mark key={i} className="rounded bg-yellow-500/30 px-0.5">
            {text.slice(start, end + 1)}
          </mark>,
        );
        lastIndex = end + 1;
      });

      // Add remaining text after last match
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return <>{parts}</>;
    },
    [debouncedQuery, searchResults],
  );

  // Determine if search is active
  const isSearchActive = Boolean(debouncedQuery.trim());

  // Group threads by date (only when not searching)
  const groupedThreads = useMemo(
    () => (isSearchActive ? [] : groupThreadsByDate(threads)),
    [threads, isSearchActive],
  );

  // Build virtual items based on search state
  const virtualItems = useMemo((): VirtualItem[] => {
    if (isSearchActive) {
      // Flat list for search results (no date grouping)
      return filteredThreads.map((thread) => ({
        type: "thread" as const,
        thread,
        highlightedTitle: highlightMatch(thread.title ?? "New conversation"),
      }));
    }
    // Grouped list when not searching
    return flattenGroupsForVirtualization(groupedThreads);
  }, [isSearchActive, filteredThreads, groupedThreads, highlightMatch]);

  // Set up virtualizer
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = virtualItems[index];
      return item?.type === "header" ? 32 : 48;
    },
    overscan: 5,
  });

  // Loading state
  if (threadsQuery.isLoading) {
    return (
      <div className="space-y-2 px-3 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Empty state - no threads at all
  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="bg-muted mb-4 rounded-full p-3">
          <MessageSquare className="text-muted-foreground h-6 w-6" />
        </div>
        <p className="text-muted-foreground text-sm">No conversations yet</p>
        <p className="text-muted-foreground/70 mt-1 text-xs">
          Start a new chat to begin
        </p>
      </div>
    );
  }

  // No search results state
  if (isSearchActive && filteredThreads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="bg-muted mb-4 rounded-full p-3">
          <Search className="text-muted-foreground h-6 w-6" />
        </div>
        <p className="text-muted-foreground text-sm">No conversations found</p>
        <p className="text-muted-foreground/70 mt-1 text-xs">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = virtualItems[virtualRow.index];
          if (!item) return null;

          return (
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
              {item.type === "header" ? (
                <SidebarThreadGroup group={item.group} />
              ) : (
                <div className="px-2" onClick={onThreadSelect}>
                  <ThreadItem
                    thread={item.thread}
                    isActive={item.thread.id === activeThreadId}
                    activeThreadId={activeThreadId}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
