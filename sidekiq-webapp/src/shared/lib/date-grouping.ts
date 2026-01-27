import {
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  formatDistanceToNow,
  format,
} from "date-fns";
import type { SidekiqAvatar } from "@sidekiq/shared/db/schema";

/**
 * Date group categories for thread organization.
 * Pinned is separate from date groups per CONTEXT.md.
 */
export type DateGroup =
  | "Pinned"
  | "Today"
  | "Yesterday"
  | "This Week"
  | "This Month"
  | "Older";

/**
 * Thread data required for date grouping.
 * Matches the Thread interface from thread-item.tsx.
 */
export interface Thread {
  id: string;
  title: string | null;
  isPinned: boolean;
  isArchived: boolean;
  lastActivityAt: Date;
  messageCount: number;
  /** Foreign key to sidekiqs table (null for regular threads) */
  sidekiqId: string | null;
  /** Preserved name if the Sidekiq was deleted */
  deletedSidekiqName?: string | null;
  /** Related Sidekiq data (null if regular thread or Sidekiq deleted) */
  sidekiq?: {
    id: string;
    name: string;
    avatar: SidekiqAvatar;
  } | null;
}

/**
 * A group of threads under a date category.
 */
export interface GroupedThreads {
  /** The date group category */
  group: DateGroup;
  /** Threads in this group, sorted by most recent activity */
  threads: Thread[];
}

/** Display order for date groups */
const GROUP_ORDER: DateGroup[] = [
  "Pinned",
  "Today",
  "Yesterday",
  "This Week",
  "This Month",
  "Older",
];

/**
 * Groups threads by date category.
 *
 * Rules:
 * - Pinned threads appear ONLY in the Pinned group (not duplicated in date groups)
 * - Archived threads are excluded from grouping
 * - Within each group, threads are sorted by most recent activity first
 * - Empty groups are filtered out (not returned)
 *
 * @example
 * ```tsx
 * const threads = api.thread.list.useQuery();
 * const grouped = useMemo(
 *   () => groupThreadsByDate(threads.data ?? []),
 *   [threads.data]
 * );
 * ```
 *
 * @param threads - Array of threads to group
 * @returns Array of grouped threads in display order (Pinned, Today, Yesterday, This Week, This Month, Older)
 */
export function groupThreadsByDate(threads: Thread[]): GroupedThreads[] {
  const groups: Record<DateGroup, Thread[]> = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    "This Week": [],
    "This Month": [],
    Older: [],
  };

  for (const thread of threads) {
    // Skip archived threads
    if (thread.isArchived) {
      continue;
    }

    // Pinned threads go to Pinned group only (no duplication in date groups)
    if (thread.isPinned) {
      groups.Pinned.push(thread);
      continue;
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

  // Sort each group by most recent activity first
  for (const group of Object.values(groups)) {
    group.sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime(),
    );
  }

  // Return only non-empty groups in display order
  return GROUP_ORDER.filter((group) => groups[group].length > 0).map(
    (group) => ({
      group,
      threads: groups[group],
    }),
  );
}

/**
 * Formats a thread timestamp for display in the sidebar.
 *
 * Returns:
 * - For today: relative time (e.g., "2h ago", "5m ago")
 * - For yesterday: "Yesterday"
 * - For older: short date (e.g., "Jan 15")
 *
 * @example
 * ```tsx
 * <span className="text-muted-foreground text-xs">
 *   {formatThreadTimestamp(thread.lastActivityAt)}
 * </span>
 * ```
 *
 * @param date - The date to format
 * @returns Formatted timestamp string
 */
export function formatThreadTimestamp(date: Date): string {
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  return format(date, "MMM d");
}
