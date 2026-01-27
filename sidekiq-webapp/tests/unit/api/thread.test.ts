import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock modules before importing
vi.mock("@sidekiq/shared/db", () => ({
  db: {
    query: {
      threads: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock("@sidekiq/server/better-auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Import after mocks
import { threadRouter } from "@sidekiq/chats/api/router";
import { createCallerFactory } from "@sidekiq/shared/trpc/trpc";
import { db } from "@sidekiq/shared/db";

/**
 * Helper to create a mock context with session
 */
function createMockContext(userId: string | null = "user-123") {
  return {
    db,
    session: userId
      ? {
          session: {
            id: "session-123",
            createdAt: new Date(),
            updatedAt: new Date(),
            userId,
            expiresAt: new Date(Date.now() + 86400000),
            token: "mock-token",
            ipAddress: null,
            userAgent: null,
          },
          user: {
            id: userId,
            email: "test@example.com",
            name: "Test User",
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: true,
            image: null,
          },
        }
      : null,
    headers: new Headers(),
  };
}

/**
 * Helper to create a tRPC caller with the given context
 */
function createCaller(ctx: ReturnType<typeof createMockContext>) {
  const createCaller = createCallerFactory(threadRouter);
  return createCaller(ctx);
}

describe("thread router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTitle", () => {
    it("should require authentication", async () => {
      const caller = createCaller(createMockContext(null));

      await expect(caller.getTitle({ threadId: "thread-123" })).rejects.toThrow(
        TRPCError,
      );
    });

    it("should return title for owned thread", async () => {
      (db.query.threads.findFirst as Mock).mockResolvedValue({
        title: "My conversation",
      });

      const caller = createCaller(createMockContext("user-123"));
      const result = await caller.getTitle({ threadId: "thread-123" });

      expect(result.title).toBe("My conversation");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(db.query.threads.findFirst).toHaveBeenCalled();
    });

    it("should return null for non-existent thread", async () => {
      (db.query.threads.findFirst as Mock).mockResolvedValue(null);

      const caller = createCaller(createMockContext("user-123"));
      const result = await caller.getTitle({ threadId: "non-existent" });

      expect(result.title).toBeNull();
    });
  });

  describe("list", () => {
    it("should require authentication", async () => {
      const caller = createCaller(createMockContext(null));

      await expect(caller.list()).rejects.toThrow(TRPCError);
    });

    it("should return threads excluding archived by default", async () => {
      const mockThreads = [
        {
          id: "thread-1",
          title: "Thread 1",
          isPinned: true,
          isArchived: false,
          lastActivityAt: new Date(),
          messageCount: 5,
        },
      ];
      (db.query.threads.findMany as Mock).mockResolvedValue(mockThreads);

      const caller = createCaller(createMockContext("user-123"));
      const result = await caller.list();

      expect(result).toEqual(mockThreads);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(db.query.threads.findMany).toHaveBeenCalled();
    });

    it("should include archived threads when includeArchived is true", async () => {
      const mockThreads = [
        {
          id: "thread-1",
          title: "Active Thread",
          isPinned: false,
          isArchived: false,
          lastActivityAt: new Date(),
          messageCount: 5,
        },
        {
          id: "thread-2",
          title: "Archived Thread",
          isPinned: false,
          isArchived: true,
          lastActivityAt: new Date(),
          messageCount: 3,
        },
      ];
      (db.query.threads.findMany as Mock).mockResolvedValue(mockThreads);

      const caller = createCaller(createMockContext("user-123"));
      const result = await caller.list({ includeArchived: true });

      expect(result).toEqual(mockThreads);
    });
  });

  describe("delete", () => {
    it("should require authentication", async () => {
      const caller = createCaller(createMockContext(null));

      await expect(caller.delete({ threadId: "thread-123" })).rejects.toThrow(
        TRPCError,
      );
    });

    it("should return deletedId on success", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "thread-123" }]),
        }),
      });
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      (db.delete as Mock).mockImplementation(mockDelete);

      const caller = createCaller(createMockContext("user-123"));
      const result = await caller.delete({ threadId: "thread-123" });

      expect(result.success).toBe(true);
      expect(result.deletedId).toBe("thread-123");
    });

    it("should throw NOT_FOUND for non-existent thread", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      (db.delete as Mock).mockImplementation(mockDelete);

      const caller = createCaller(createMockContext("user-123"));

      await expect(caller.delete({ threadId: "non-existent" })).rejects.toThrow(
        TRPCError,
      );

      try {
        await caller.delete({ threadId: "non-existent" });
      } catch (error) {
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("archive", () => {
    it("should require authentication", async () => {
      const caller = createCaller(createMockContext(null));

      await expect(caller.archive({ threadId: "thread-123" })).rejects.toThrow(
        TRPCError,
      );
    });

    it("should set isArchived to true", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: "thread-123", isArchived: true }]),
          }),
        }),
      });
      (db.update as Mock).mockImplementation(mockUpdate);

      const caller = createCaller(createMockContext("user-123"));
      const result = await caller.archive({ threadId: "thread-123" });

      expect(result.id).toBe("thread-123");
      expect(result.isArchived).toBe(true);
    });

    it("should throw NOT_FOUND for non-existent thread", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      (db.update as Mock).mockImplementation(mockUpdate);

      const caller = createCaller(createMockContext("user-123"));

      await expect(
        caller.archive({ threadId: "non-existent" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("unarchive", () => {
    it("should require authentication", async () => {
      const caller = createCaller(createMockContext(null));

      await expect(
        caller.unarchive({ threadId: "thread-123" }),
      ).rejects.toThrow(TRPCError);
    });

    it("should set isArchived to false", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: "thread-123", isArchived: false }]),
          }),
        }),
      });
      (db.update as Mock).mockImplementation(mockUpdate);

      const caller = createCaller(createMockContext("user-123"));
      const result = await caller.unarchive({ threadId: "thread-123" });

      expect(result.id).toBe("thread-123");
      expect(result.isArchived).toBe(false);
    });

    it("should throw NOT_FOUND for non-existent thread", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      (db.update as Mock).mockImplementation(mockUpdate);

      const caller = createCaller(createMockContext("user-123"));

      await expect(
        caller.unarchive({ threadId: "non-existent" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("togglePin", () => {
    it("should require authentication", async () => {
      const caller = createCaller(createMockContext(null));

      await expect(
        caller.togglePin({ threadId: "thread-123" }),
      ).rejects.toThrow(TRPCError);
    });

    it("should toggle isPinned from false to true", async () => {
      // First query returns current state
      (db.query.threads.findFirst as Mock).mockResolvedValue({
        isPinned: false,
      });

      // Update returns new state
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: "thread-123", isPinned: true }]),
          }),
        }),
      });
      (db.update as Mock).mockImplementation(mockUpdate);

      const caller = createCaller(createMockContext("user-123"));
      const result = await caller.togglePin({ threadId: "thread-123" });

      expect(result.id).toBe("thread-123");
      expect(result.isPinned).toBe(true);
    });

    it("should toggle isPinned from true to false", async () => {
      (db.query.threads.findFirst as Mock).mockResolvedValue({
        isPinned: true,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: "thread-123", isPinned: false }]),
          }),
        }),
      });
      (db.update as Mock).mockImplementation(mockUpdate);

      const caller = createCaller(createMockContext("user-123"));
      const result = await caller.togglePin({ threadId: "thread-123" });

      expect(result.id).toBe("thread-123");
      expect(result.isPinned).toBe(false);
    });

    it("should throw NOT_FOUND for non-existent thread", async () => {
      (db.query.threads.findFirst as Mock).mockResolvedValue(null);

      const caller = createCaller(createMockContext("user-123"));

      await expect(
        caller.togglePin({ threadId: "non-existent" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("rename", () => {
    it("should require authentication", async () => {
      const caller = createCaller(createMockContext(null));

      await expect(
        caller.rename({ threadId: "thread-123", title: "New title" }),
      ).rejects.toThrow(TRPCError);
    });

    it("should update thread title", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: "thread-123", title: "New title" }]),
          }),
        }),
      });
      (db.update as Mock).mockImplementation(mockUpdate);

      const caller = createCaller(createMockContext("user-123"));
      const result = await caller.rename({
        threadId: "thread-123",
        title: "New title",
      });

      expect(result.id).toBe("thread-123");
      expect(result.title).toBe("New title");
    });

    it("should throw NOT_FOUND for non-existent thread", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      (db.update as Mock).mockImplementation(mockUpdate);

      const caller = createCaller(createMockContext("user-123"));

      await expect(
        caller.rename({ threadId: "non-existent", title: "New title" }),
      ).rejects.toThrow(TRPCError);
    });

    it("should validate title length", async () => {
      const caller = createCaller(createMockContext("user-123"));

      // Empty title should fail validation
      await expect(
        caller.rename({ threadId: "thread-123", title: "" }),
      ).rejects.toThrow();

      // Title > 255 chars should fail validation
      await expect(
        caller.rename({ threadId: "thread-123", title: "A".repeat(256) }),
      ).rejects.toThrow();
    });
  });
});
