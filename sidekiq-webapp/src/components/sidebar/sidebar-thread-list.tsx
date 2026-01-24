"use client";

import { useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MessageSquare } from "lucide-react";

import { api } from "@sidekiq/trpc/react";
import { useScrollPosition } from "@sidekiq/hooks/use-scroll-position";
import {
  groupThreadsByDate,
  type DateGroup,
  type Thread,
  type GroupedThreads,
} from "@sidekiq/lib/date-grouping";
import { ThreadItem } from "@sidekiq/components/thread/thread-item";
import { SidebarThreadGroup } from "./sidebar-thread-group";
import { Skeleton } from "@sidekiq/components/ui/skeleton";

/**
 * Virtual item type for flattened groups.
 * Either a date group header or a thread item.
 */
type VirtualItem =
  | { type: "header"; group: DateGroup }
  | { type: "thread"; thread: Thread };

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
  /** Search query for filtering - used in Plan 05-04 */
  searchQuery?: string;
}

/**
 * Virtualized thread list with date grouping.
 *
 * Features:
 * - TanStack Virtual for performance with large thread lists
 * - Date grouping (Pinned, Today, Yesterday, This Week, This Month, Older)
 * - Scroll position preservation when switching threads
 * - Active thread highlighting via pathname
 * - Empty and loading states
 *
 * @example
 * ```tsx
 * <SidebarThreadList />
 * // Or with search:
 * <SidebarThreadList searchQuery={searchQuery} />
 * ```
 */
export function SidebarThreadList({
  searchQuery: _searchQuery,
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

  // Memoize threads to avoid dependency changes on every render
  const threads = useMemo(
    () => threadsQuery.data ?? [],
    [threadsQuery.data],
  );

  // Group threads by date (memoized)
  const groupedThreads = useMemo(() => groupThreadsByDate(threads), [threads]);

  // Flatten groups for virtualization
  const virtualItems = useMemo(
    () => flattenGroupsForVirtualization(groupedThreads),
    [groupedThreads],
  );

  // Set up virtualizer
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = virtualItems[index];
      return item?.type === "header" ? 32 : 48; // Headers shorter than items
    },
    overscan: 5, // Render 5 extra items above/below viewport
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

  // Empty state
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
                <div className="px-2">
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
