import { describe, expect, it } from "vitest";
import {
  threadIdSchema,
  threadTitleSchema,
  deleteThreadInputSchema,
  archiveThreadInputSchema,
  unarchiveThreadInputSchema,
  togglePinInputSchema,
  renameThreadInputSchema,
  listThreadsInputSchema,
  getTitleInputSchema,
} from "@sidekiq/lib/validations/thread";

describe("threadIdSchema", () => {
  it("should accept valid thread ID", () => {
    const result = threadIdSchema.safeParse("thread-abc123");
    expect(result.success).toBe(true);
  });

  it("should reject empty string", () => {
    const result = threadIdSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Thread ID is required");
    }
  });
});

describe("threadTitleSchema", () => {
  it("should accept valid title", () => {
    const result = threadTitleSchema.safeParse("My conversation");
    expect(result.success).toBe(true);
  });

  it("should accept minimum length title (1 char)", () => {
    const result = threadTitleSchema.safeParse("A");
    expect(result.success).toBe(true);
  });

  it("should accept maximum length title (255 chars)", () => {
    const result = threadTitleSchema.safeParse("A".repeat(255));
    expect(result.success).toBe(true);
  });

  it("should reject empty string", () => {
    const result = threadTitleSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Title cannot be empty");
    }
  });

  it("should reject title exceeding 255 characters", () => {
    const result = threadTitleSchema.safeParse("A".repeat(256));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Title must be at most 255 characters",
      );
    }
  });
});

describe("deleteThreadInputSchema", () => {
  it("should accept valid input", () => {
    const result = deleteThreadInputSchema.safeParse({
      threadId: "thread-123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing threadId", () => {
    const result = deleteThreadInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject empty threadId", () => {
    const result = deleteThreadInputSchema.safeParse({ threadId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Thread ID is required");
    }
  });
});

describe("archiveThreadInputSchema", () => {
  it("should accept valid input", () => {
    const result = archiveThreadInputSchema.safeParse({
      threadId: "thread-123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty threadId", () => {
    const result = archiveThreadInputSchema.safeParse({ threadId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Thread ID is required");
    }
  });
});

describe("unarchiveThreadInputSchema", () => {
  it("should accept valid input", () => {
    const result = unarchiveThreadInputSchema.safeParse({
      threadId: "thread-123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty threadId", () => {
    const result = unarchiveThreadInputSchema.safeParse({ threadId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Thread ID is required");
    }
  });
});

describe("togglePinInputSchema", () => {
  it("should accept valid input", () => {
    const result = togglePinInputSchema.safeParse({
      threadId: "thread-123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty threadId", () => {
    const result = togglePinInputSchema.safeParse({ threadId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Thread ID is required");
    }
  });
});

describe("renameThreadInputSchema", () => {
  it("should accept valid input", () => {
    const result = renameThreadInputSchema.safeParse({
      threadId: "thread-123",
      title: "New title",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty threadId", () => {
    const result = renameThreadInputSchema.safeParse({
      threadId: "",
      title: "New title",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Thread ID is required");
    }
  });

  it("should reject empty title", () => {
    const result = renameThreadInputSchema.safeParse({
      threadId: "thread-123",
      title: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Title cannot be empty");
    }
  });

  it("should reject title exceeding 255 characters", () => {
    const result = renameThreadInputSchema.safeParse({
      threadId: "thread-123",
      title: "A".repeat(256),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Title must be at most 255 characters",
      );
    }
  });
});

describe("listThreadsInputSchema", () => {
  it("should accept undefined", () => {
    const result = listThreadsInputSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = listThreadsInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept includeArchived true", () => {
    const result = listThreadsInputSchema.safeParse({ includeArchived: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.includeArchived).toBe(true);
    }
  });

  it("should accept includeArchived false", () => {
    const result = listThreadsInputSchema.safeParse({ includeArchived: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.includeArchived).toBe(false);
    }
  });

  it("should default includeArchived to false when not provided", () => {
    const result = listThreadsInputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.includeArchived).toBe(false);
    }
  });
});

describe("getTitleInputSchema", () => {
  it("should accept valid input", () => {
    const result = getTitleInputSchema.safeParse({
      threadId: "thread-123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty threadId", () => {
    const result = getTitleInputSchema.safeParse({ threadId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Thread ID is required");
    }
  });
});
