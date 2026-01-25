import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  groupThreadsByDate,
  formatThreadTimestamp,
  type Thread,
} from "@sidekiq/lib/date-grouping";

/**
 * Unit tests for date-grouping.ts functions.
 *
 * Tests cover:
 * - groupThreadsByDate: thread categorization by date with proper sorting
 * - formatThreadTimestamp: human-readable timestamp formatting
 */

// Helper to create mock threads
function createThread(
  overrides: Partial<Thread> & { id: string; lastActivityAt: Date },
): Thread {
  return {
    title: `Thread ${overrides.id}`,
    isPinned: false,
    isArchived: false,
    messageCount: 1,
    sidekiqId: null,
    ...overrides,
  };
}

describe("groupThreadsByDate", () => {
  beforeEach(() => {
    // Set a fixed "now" for consistent date comparisons
    // January 24, 2026, 12:00:00 UTC (Friday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-24T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("edge cases", () => {
    it("should return empty array for empty input", () => {
      const result = groupThreadsByDate([]);
      expect(result).toEqual([]);
    });

    it("should return empty array when all threads are archived", () => {
      const threads: Thread[] = [
        createThread({
          id: "1",
          lastActivityAt: new Date("2026-01-24T10:00:00.000Z"),
          isArchived: true,
        }),
        createThread({
          id: "2",
          lastActivityAt: new Date("2026-01-23T10:00:00.000Z"),
          isArchived: true,
        }),
      ];

      const result = groupThreadsByDate(threads);
      expect(result).toEqual([]);
    });
  });

  describe("archived threads", () => {
    it("should exclude archived threads from all groups", () => {
      const threads: Thread[] = [
        createThread({
          id: "1",
          lastActivityAt: new Date("2026-01-24T10:00:00.000Z"),
          isArchived: true,
        }),
        createThread({
          id: "2",
          lastActivityAt: new Date("2026-01-24T11:00:00.000Z"),
          isArchived: false,
        }),
      ];

      const result = groupThreadsByDate(threads);

      expect(result).toHaveLength(1);

      const firstGroup = result[0]!;
      expect(firstGroup.group).toBe("Today");
      expect(firstGroup.threads).toHaveLength(1);
      expect(firstGroup.threads[0]?.id).toBe("2");
    });
  });

  describe("pinned threads", () => {
    it("should place pinned threads only in Pinned group", () => {
      const threads: Thread[] = [
        createThread({
          id: "1",
          lastActivityAt: new Date("2026-01-24T10:00:00.000Z"),
          isPinned: true,
        }),
      ];

      const result = groupThreadsByDate(threads);

      expect(result).toHaveLength(1);

      const firstGroup = result[0]!;
      expect(firstGroup.group).toBe("Pinned");
      expect(firstGroup.threads[0]?.id).toBe("1");
    });

    it("should NOT duplicate pinned threads in date groups", () => {
      const threads: Thread[] = [
        createThread({
          id: "pinned-today",
          lastActivityAt: new Date("2026-01-24T10:00:00.000Z"),
          isPinned: true,
        }),
        createThread({
          id: "regular-today",
          lastActivityAt: new Date("2026-01-24T11:00:00.000Z"),
          isPinned: false,
        }),
      ];

      const result = groupThreadsByDate(threads);

      // Should have Pinned and Today groups
      expect(result).toHaveLength(2);

      const pinnedGroup = result.find((g) => g.group === "Pinned");
      const todayGroup = result.find((g) => g.group === "Today");

      expect(pinnedGroup).toBeDefined();
      expect(pinnedGroup!.threads).toHaveLength(1);
      expect(pinnedGroup!.threads[0]?.id).toBe("pinned-today");

      expect(todayGroup).toBeDefined();
      expect(todayGroup!.threads).toHaveLength(1);
      expect(todayGroup!.threads[0]?.id).toBe("regular-today");
    });
  });

  describe("date categorization", () => {
    it("should categorize today threads in Today group", () => {
      const threads: Thread[] = [
        createThread({
          id: "1",
          lastActivityAt: new Date("2026-01-24T08:00:00.000Z"),
        }),
        createThread({
          id: "2",
          lastActivityAt: new Date("2026-01-24T10:00:00.000Z"),
        }),
      ];

      const result = groupThreadsByDate(threads);

      expect(result).toHaveLength(1);

      const firstGroup = result[0]!;
      expect(firstGroup.group).toBe("Today");
      expect(firstGroup.threads).toHaveLength(2);
    });

    it("should categorize yesterday threads in Yesterday group", () => {
      const threads: Thread[] = [
        createThread({
          id: "1",
          lastActivityAt: new Date("2026-01-23T20:00:00.000Z"),
        }),
      ];

      const result = groupThreadsByDate(threads);

      expect(result).toHaveLength(1);

      const firstGroup = result[0]!;
      expect(firstGroup.group).toBe("Yesterday");
      expect(firstGroup.threads[0]?.id).toBe("1");
    });

    it("should categorize this week threads (not today/yesterday) in This Week group", () => {
      // January 24, 2026 is Friday, so Monday (Jan 19) through Wednesday (Jan 22) are this week but not today/yesterday
      const threads: Thread[] = [
        createThread({
          id: "1",
          lastActivityAt: new Date("2026-01-22T10:00:00.000Z"), // Wednesday
        }),
        createThread({
          id: "2",
          lastActivityAt: new Date("2026-01-20T10:00:00.000Z"), // Monday
        }),
      ];

      const result = groupThreadsByDate(threads);

      expect(result).toHaveLength(1);

      const firstGroup = result[0]!;
      expect(firstGroup.group).toBe("This Week");
      expect(firstGroup.threads).toHaveLength(2);
    });

    it("should categorize this month threads (not this week) in This Month group", () => {
      // January 24, 2026 is Friday. Previous week would be before Jan 19
      const threads: Thread[] = [
        createThread({
          id: "1",
          lastActivityAt: new Date("2026-01-10T10:00:00.000Z"),
        }),
        createThread({
          id: "2",
          lastActivityAt: new Date("2026-01-05T10:00:00.000Z"),
        }),
      ];

      const result = groupThreadsByDate(threads);

      expect(result).toHaveLength(1);

      const firstGroup = result[0]!;
      expect(firstGroup.group).toBe("This Month");
      expect(firstGroup.threads).toHaveLength(2);
    });

    it("should categorize older threads in Older group", () => {
      const threads: Thread[] = [
        createThread({
          id: "1",
          lastActivityAt: new Date("2025-12-15T10:00:00.000Z"),
        }),
        createThread({
          id: "2",
          lastActivityAt: new Date("2025-06-01T10:00:00.000Z"),
        }),
      ];

      const result = groupThreadsByDate(threads);

      expect(result).toHaveLength(1);

      const firstGroup = result[0]!;
      expect(firstGroup.group).toBe("Older");
      expect(firstGroup.threads).toHaveLength(2);
    });
  });

  describe("sorting within groups", () => {
    it("should sort threads within each group by lastActivityAt descending", () => {
      const threads: Thread[] = [
        createThread({
          id: "older",
          lastActivityAt: new Date("2026-01-24T08:00:00.000Z"),
        }),
        createThread({
          id: "newest",
          lastActivityAt: new Date("2026-01-24T11:00:00.000Z"),
        }),
        createThread({
          id: "middle",
          lastActivityAt: new Date("2026-01-24T09:30:00.000Z"),
        }),
      ];

      const result = groupThreadsByDate(threads);

      expect(result).toHaveLength(1);

      const firstGroup = result[0]!;
      expect(firstGroup.threads[0]?.id).toBe("newest");
      expect(firstGroup.threads[1]?.id).toBe("middle");
      expect(firstGroup.threads[2]?.id).toBe("older");
    });

    it("should sort pinned threads by lastActivityAt descending", () => {
      const threads: Thread[] = [
        createThread({
          id: "pinned-old",
          lastActivityAt: new Date("2026-01-20T10:00:00.000Z"),
          isPinned: true,
        }),
        createThread({
          id: "pinned-new",
          lastActivityAt: new Date("2026-01-24T10:00:00.000Z"),
          isPinned: true,
        }),
      ];

      const result = groupThreadsByDate(threads);

      const firstGroup = result[0]!;
      expect(firstGroup.group).toBe("Pinned");
      expect(firstGroup.threads[0]?.id).toBe("pinned-new");
      expect(firstGroup.threads[1]?.id).toBe("pinned-old");
    });
  });

  describe("empty groups", () => {
    it("should not include empty groups in output", () => {
      const threads: Thread[] = [
        createThread({
          id: "1",
          lastActivityAt: new Date("2026-01-24T10:00:00.000Z"),
        }),
        // Only Today group should be included
      ];

      const result = groupThreadsByDate(threads);

      expect(result).toHaveLength(1);

      const firstGroup = result[0]!;
      expect(firstGroup.group).toBe("Today");

      // Verify other groups are not present
      const groupNames = result.map((g) => g.group);
      expect(groupNames).not.toContain("Pinned");
      expect(groupNames).not.toContain("Yesterday");
      expect(groupNames).not.toContain("This Week");
      expect(groupNames).not.toContain("This Month");
      expect(groupNames).not.toContain("Older");
    });
  });

  describe("group order", () => {
    it("should return groups in order: Pinned, Today, Yesterday, This Week, This Month, Older", () => {
      const threads: Thread[] = [
        createThread({
          id: "older",
          lastActivityAt: new Date("2025-12-01T10:00:00.000Z"),
        }),
        createThread({
          id: "this-month",
          lastActivityAt: new Date("2026-01-05T10:00:00.000Z"),
        }),
        createThread({
          id: "this-week",
          lastActivityAt: new Date("2026-01-20T10:00:00.000Z"),
        }),
        createThread({
          id: "yesterday",
          lastActivityAt: new Date("2026-01-23T10:00:00.000Z"),
        }),
        createThread({
          id: "today",
          lastActivityAt: new Date("2026-01-24T10:00:00.000Z"),
        }),
        createThread({
          id: "pinned",
          lastActivityAt: new Date("2025-01-01T10:00:00.000Z"),
          isPinned: true,
        }),
      ];

      const result = groupThreadsByDate(threads);
      const groupOrder = result.map((g) => g.group);

      expect(groupOrder).toEqual([
        "Pinned",
        "Today",
        "Yesterday",
        "This Week",
        "This Month",
        "Older",
      ]);
    });
  });

  describe("complex scenarios", () => {
    it("should handle mixed threads correctly", () => {
      const threads: Thread[] = [
        // Archived - should be excluded
        createThread({
          id: "archived",
          lastActivityAt: new Date("2026-01-24T10:00:00.000Z"),
          isArchived: true,
        }),
        // Pinned - should go to Pinned only
        createThread({
          id: "pinned",
          lastActivityAt: new Date("2026-01-24T09:00:00.000Z"),
          isPinned: true,
        }),
        // Regular today
        createThread({
          id: "today-1",
          lastActivityAt: new Date("2026-01-24T11:00:00.000Z"),
        }),
        createThread({
          id: "today-2",
          lastActivityAt: new Date("2026-01-24T08:00:00.000Z"),
        }),
        // Yesterday
        createThread({
          id: "yesterday-1",
          lastActivityAt: new Date("2026-01-23T15:00:00.000Z"),
        }),
      ];

      const result = groupThreadsByDate(threads);

      expect(result).toHaveLength(3);

      // Pinned group
      const pinnedGroup = result[0]!;
      expect(pinnedGroup.group).toBe("Pinned");
      expect(pinnedGroup.threads).toHaveLength(1);
      expect(pinnedGroup.threads[0]?.id).toBe("pinned");

      // Today group (sorted by most recent)
      const todayGroup = result[1]!;
      expect(todayGroup.group).toBe("Today");
      expect(todayGroup.threads).toHaveLength(2);
      expect(todayGroup.threads[0]?.id).toBe("today-1");
      expect(todayGroup.threads[1]?.id).toBe("today-2");

      // Yesterday group
      const yesterdayGroup = result[2]!;
      expect(yesterdayGroup.group).toBe("Yesterday");
      expect(yesterdayGroup.threads).toHaveLength(1);
      expect(yesterdayGroup.threads[0]?.id).toBe("yesterday-1");
    });
  });
});

describe("formatThreadTimestamp", () => {
  beforeEach(() => {
    // Set a fixed "now" for consistent formatting
    // January 24, 2026, 14:00:00 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-24T14:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("today timestamps", () => {
    it("should return relative time for today (hours ago)", () => {
      const twoHoursAgo = new Date("2026-01-24T12:00:00.000Z");
      const result = formatThreadTimestamp(twoHoursAgo);

      expect(result).toMatch(/2 hours ago|about 2 hours ago/);
    });

    it("should return relative time for today (minutes ago)", () => {
      const fiveMinutesAgo = new Date("2026-01-24T13:55:00.000Z");
      const result = formatThreadTimestamp(fiveMinutesAgo);

      expect(result).toMatch(/5 minutes ago|about 5 minutes ago/);
    });

    it("should return relative time for today (less than a minute ago)", () => {
      const justNow = new Date("2026-01-24T13:59:30.000Z");
      const result = formatThreadTimestamp(justNow);

      expect(result).toMatch(/less than a minute ago|1 minute ago/);
    });
  });

  describe("yesterday timestamps", () => {
    it("should return 'Yesterday' for yesterday's date", () => {
      const yesterday = new Date("2026-01-23T10:00:00.000Z");
      const result = formatThreadTimestamp(yesterday);

      expect(result).toBe("Yesterday");
    });

    it("should return 'Yesterday' regardless of time of day", () => {
      const yesterdayMorning = new Date("2026-01-23T06:00:00.000Z");
      const yesterdayEvening = new Date("2026-01-23T23:00:00.000Z");

      expect(formatThreadTimestamp(yesterdayMorning)).toBe("Yesterday");
      expect(formatThreadTimestamp(yesterdayEvening)).toBe("Yesterday");
    });
  });

  describe("older timestamps", () => {
    it("should return 'MMM d' format for dates older than yesterday", () => {
      const janFifteen = new Date("2026-01-15T10:00:00.000Z");
      const result = formatThreadTimestamp(janFifteen);

      expect(result).toBe("Jan 15");
    });

    it("should format December date correctly", () => {
      const decTwenty = new Date("2025-12-20T10:00:00.000Z");
      const result = formatThreadTimestamp(decTwenty);

      expect(result).toBe("Dec 20");
    });

    it("should format dates from previous year", () => {
      const lastYear = new Date("2025-06-15T10:00:00.000Z");
      const result = formatThreadTimestamp(lastYear);

      expect(result).toBe("Jun 15");
    });

    it("should format single digit day without leading zero", () => {
      const janFive = new Date("2026-01-05T10:00:00.000Z");
      const result = formatThreadTimestamp(janFive);

      expect(result).toBe("Jan 5");
    });
  });
});
