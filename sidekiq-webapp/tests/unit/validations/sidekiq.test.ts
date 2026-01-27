import { describe, expect, it } from "vitest";
import {
  sidekiqAvatarSchema,
  createSidekiqSchema,
  sidekiqFormSchema,
  updateSidekiqSchema,
  deleteSidekiqSchema,
  toggleFavoriteSchema,
  duplicateSidekiqSchema,
  listSidekiqsSchema,
  getSidekiqByIdSchema,
} from "@sidekiq/sidekiqs/validations";

describe("sidekiqAvatarSchema", () => {
  it("should accept valid initials type with hex color", () => {
    const result = sidekiqAvatarSchema.safeParse({
      type: "initials",
      color: "#6366f1",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid emoji type with hex color and emoji", () => {
    const result = sidekiqAvatarSchema.safeParse({
      type: "emoji",
      color: "#ef4444",
      emoji: "🤖",
    });
    expect(result.success).toBe(true);
  });

  it("should accept initials type without emoji field", () => {
    const result = sidekiqAvatarSchema.safeParse({
      type: "initials",
      color: "#22c55e",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emoji).toBeUndefined();
    }
  });

  it("should reject hex color missing # prefix", () => {
    const result = sidekiqAvatarSchema.safeParse({
      type: "initials",
      color: "6366f1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid hex color");
    }
  });

  it("should reject hex color with wrong length (3 chars)", () => {
    const result = sidekiqAvatarSchema.safeParse({
      type: "initials",
      color: "#fff",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid hex color");
    }
  });

  it("should reject hex color with invalid characters", () => {
    const result = sidekiqAvatarSchema.safeParse({
      type: "initials",
      color: "#gggggg",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid hex color");
    }
  });

  it("should reject invalid type enum value", () => {
    const result = sidekiqAvatarSchema.safeParse({
      type: "image",
      color: "#6366f1",
    });
    expect(result.success).toBe(false);
  });

  it("should accept lowercase hex color", () => {
    const result = sidekiqAvatarSchema.safeParse({
      type: "initials",
      color: "#abcdef",
    });
    expect(result.success).toBe(true);
  });

  it("should accept uppercase hex color", () => {
    const result = sidekiqAvatarSchema.safeParse({
      type: "initials",
      color: "#ABCDEF",
    });
    expect(result.success).toBe(true);
  });
});

describe("createSidekiqSchema", () => {
  it("should accept valid complete input", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Code Helper",
      description: "A helpful coding assistant",
      instructions: "You are a helpful coding assistant.",
      conversationStarters: ["Help me debug", "Explain this code"],
      defaultModel: "gpt-4o",
      avatar: { type: "emoji", color: "#3b82f6", emoji: "🤖" },
    });
    expect(result.success).toBe(true);
  });

  it("should accept minimal input with defaults", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Test",
      instructions: "Test instructions",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conversationStarters).toEqual([]);
      expect(result.data.avatar).toEqual({
        type: "initials",
        color: "#6366f1",
      });
    }
  });

  it("should reject empty name (min 1 char)", () => {
    const result = createSidekiqSchema.safeParse({
      name: "",
      instructions: "Test instructions",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Name is required");
    }
  });

  it("should reject name exceeding 100 characters", () => {
    const result = createSidekiqSchema.safeParse({
      name: "A".repeat(101),
      instructions: "Test instructions",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Name must be at most 100 characters",
      );
    }
  });

  it("should accept name at exactly 100 characters", () => {
    const result = createSidekiqSchema.safeParse({
      name: "A".repeat(100),
      instructions: "Test instructions",
    });
    expect(result.success).toBe(true);
  });

  it("should reject description exceeding 500 characters", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Test",
      description: "A".repeat(501),
      instructions: "Test instructions",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Description must be at most 500 characters",
      );
    }
  });

  it("should accept null description", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Test",
      description: null,
      instructions: "Test instructions",
    });
    expect(result.success).toBe(true);
  });

  it("should reject instructions exceeding 8000 characters", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Test",
      instructions: "A".repeat(8001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Instructions must be at most 8000 characters",
      );
    }
  });

  it("should accept instructions at exactly 8000 characters", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Test",
      instructions: "A".repeat(8000),
    });
    expect(result.success).toBe(true);
  });

  it("should reject more than 6 conversation starters", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Test",
      instructions: "Test instructions",
      conversationStarters: [
        "Starter 1",
        "Starter 2",
        "Starter 3",
        "Starter 4",
        "Starter 5",
        "Starter 6",
        "Starter 7",
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Maximum 6 conversation starters",
      );
    }
  });

  it("should accept exactly 6 conversation starters", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Test",
      instructions: "Test instructions",
      conversationStarters: [
        "Starter 1",
        "Starter 2",
        "Starter 3",
        "Starter 4",
        "Starter 5",
        "Starter 6",
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should reject conversation starter exceeding 200 characters", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Test",
      instructions: "Test instructions",
      conversationStarters: ["A".repeat(201)],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Each starter must be at most 200 characters",
      );
    }
  });

  it("should apply default empty conversationStarters", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Test",
      instructions: "Test instructions",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conversationStarters).toEqual([]);
    }
  });

  it("should apply default avatar", () => {
    const result = createSidekiqSchema.safeParse({
      name: "Test",
      instructions: "Test instructions",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avatar).toEqual({
        type: "initials",
        color: "#6366f1",
      });
    }
  });
});

describe("sidekiqFormSchema", () => {
  it("should accept valid complete input", () => {
    const result = sidekiqFormSchema.safeParse({
      name: "Code Helper",
      description: "A helpful coding assistant",
      instructions: "You are a helpful coding assistant.",
      conversationStarters: ["Help me debug"],
      defaultModel: "gpt-4o",
      avatar: { type: "initials", color: "#6366f1" },
    });
    expect(result.success).toBe(true);
  });

  it("should require all fields (no defaults like createSidekiqSchema)", () => {
    const result = sidekiqFormSchema.safeParse({
      name: "Test",
      instructions: "Test instructions",
    });
    // Should fail because avatar and conversationStarters are required (no defaults)
    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const result = sidekiqFormSchema.safeParse({
      name: "",
      description: null,
      instructions: "Test instructions",
      conversationStarters: [],
      avatar: { type: "initials", color: "#6366f1" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Name is required");
    }
  });

  it("should reject name exceeding 100 chars", () => {
    const result = sidekiqFormSchema.safeParse({
      name: "A".repeat(101),
      description: null,
      instructions: "Test instructions",
      conversationStarters: [],
      avatar: { type: "initials", color: "#6366f1" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Name must be at most 100 characters",
      );
    }
  });

  it("should validate same constraints as createSidekiqSchema", () => {
    // 8000 char instruction limit
    const result = sidekiqFormSchema.safeParse({
      name: "Test",
      description: null,
      instructions: "A".repeat(8001),
      conversationStarters: [],
      avatar: { type: "initials", color: "#6366f1" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Instructions must be at most 8000 characters",
      );
    }
  });
});

describe("updateSidekiqSchema", () => {
  it("should accept valid partial update (just id + one field)", () => {
    const result = updateSidekiqSchema.safeParse({
      id: "sidekiq-123",
      name: "New Name",
    });
    expect(result.success).toBe(true);
  });

  it("should accept update with all fields", () => {
    const result = updateSidekiqSchema.safeParse({
      id: "sidekiq-123",
      name: "Updated Name",
      description: "Updated description",
      instructions: "Updated instructions",
      conversationStarters: ["New starter"],
      defaultModel: "gpt-4o-mini",
      avatar: { type: "emoji", color: "#ef4444", emoji: "🎯" },
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing id", () => {
    const result = updateSidekiqSchema.safeParse({
      name: "New Name",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty id", () => {
    const result = updateSidekiqSchema.safeParse({
      id: "",
      name: "New Name",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Sidekiq ID is required");
    }
  });

  it("should accept just id (no other fields)", () => {
    const result = updateSidekiqSchema.safeParse({
      id: "sidekiq-123",
    });
    expect(result.success).toBe(true);
  });

  it("should accept null description", () => {
    const result = updateSidekiqSchema.safeParse({
      id: "sidekiq-123",
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it("should accept null defaultModel", () => {
    const result = updateSidekiqSchema.safeParse({
      id: "sidekiq-123",
      defaultModel: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("deleteSidekiqSchema", () => {
  it("should accept valid id with default deleteThreads=false", () => {
    const result = deleteSidekiqSchema.safeParse({
      id: "sidekiq-123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deleteThreads).toBe(false);
    }
  });

  it("should accept valid id with deleteThreads=true", () => {
    const result = deleteSidekiqSchema.safeParse({
      id: "sidekiq-123",
      deleteThreads: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deleteThreads).toBe(true);
    }
  });

  it("should accept valid id with deleteThreads=false", () => {
    const result = deleteSidekiqSchema.safeParse({
      id: "sidekiq-123",
      deleteThreads: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deleteThreads).toBe(false);
    }
  });

  it("should reject missing id", () => {
    const result = deleteSidekiqSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject empty id", () => {
    const result = deleteSidekiqSchema.safeParse({
      id: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Sidekiq ID is required");
    }
  });
});

describe("toggleFavoriteSchema", () => {
  it("should accept valid id", () => {
    const result = toggleFavoriteSchema.safeParse({
      id: "sidekiq-123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty id", () => {
    const result = toggleFavoriteSchema.safeParse({
      id: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Sidekiq ID is required");
    }
  });

  it("should reject missing id", () => {
    const result = toggleFavoriteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("duplicateSidekiqSchema", () => {
  it("should accept valid id", () => {
    const result = duplicateSidekiqSchema.safeParse({
      id: "sidekiq-123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty id", () => {
    const result = duplicateSidekiqSchema.safeParse({
      id: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Sidekiq ID is required");
    }
  });

  it("should reject missing id", () => {
    const result = duplicateSidekiqSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("listSidekiqsSchema", () => {
  it("should accept undefined", () => {
    const result = listSidekiqsSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = listSidekiqsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should apply default includeThreadCount=true", () => {
    const result = listSidekiqsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.includeThreadCount).toBe(true);
    }
  });

  it("should accept includeThreadCount=false", () => {
    const result = listSidekiqsSchema.safeParse({ includeThreadCount: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.includeThreadCount).toBe(false);
    }
  });

  it("should accept includeThreadCount=true", () => {
    const result = listSidekiqsSchema.safeParse({ includeThreadCount: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.includeThreadCount).toBe(true);
    }
  });
});

describe("getSidekiqByIdSchema", () => {
  it("should accept valid id", () => {
    const result = getSidekiqByIdSchema.safeParse({
      id: "sidekiq-123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty id", () => {
    const result = getSidekiqByIdSchema.safeParse({
      id: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Sidekiq ID is required");
    }
  });

  it("should reject missing id", () => {
    const result = getSidekiqByIdSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
