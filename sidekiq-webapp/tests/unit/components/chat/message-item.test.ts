import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";

import {
  extractTextContent,
  formatTime,
  getCreatedAt,
} from "@sidekiq/components/chat/message-item";

/**
 * Helper to create a mock UIMessage with text parts
 */
function createMockMessage(
  parts: Array<{ type: string; text?: string }>,
  overrides: Partial<UIMessage> = {},
): UIMessage {
  return {
    id: "test-id",
    role: "assistant",
    parts: parts as UIMessage["parts"],
    ...overrides,
  } as UIMessage;
}

describe("extractTextContent", () => {
  it("should return text from a single text part", () => {
    const message = createMockMessage([{ type: "text", text: "Hello world" }]);
    expect(extractTextContent(message)).toBe("Hello world");
  });

  it("should concatenate multiple text parts", () => {
    const message = createMockMessage([
      { type: "text", text: "Hello " },
      { type: "text", text: "world" },
    ]);
    expect(extractTextContent(message)).toBe("Hello world");
  });

  it("should filter out non-text parts (text + tool)", () => {
    const message = createMockMessage([
      { type: "text", text: "Before tool call" },
      { type: "tool-invocation" },
      { type: "text", text: " after tool call" },
    ]);
    expect(extractTextContent(message)).toBe(
      "Before tool call after tool call",
    );
  });

  it("should return empty string when no text parts exist", () => {
    const message = createMockMessage([
      { type: "tool-invocation" },
      { type: "tool-result" },
    ]);
    expect(extractTextContent(message)).toBe("");
  });

  it("should return empty string for empty parts array", () => {
    const message = createMockMessage([]);
    expect(extractTextContent(message)).toBe("");
  });
});

describe("formatTime", () => {
  it("should format morning time correctly (9:30 AM)", () => {
    const date = new Date(2024, 0, 1, 9, 30); // Jan 1, 2024 at 9:30 AM
    expect(formatTime(date)).toBe("9:30 AM");
  });

  it("should format afternoon time correctly (3:45 PM)", () => {
    const date = new Date(2024, 0, 1, 15, 45); // Jan 1, 2024 at 3:45 PM
    expect(formatTime(date)).toBe("3:45 PM");
  });

  it("should format midnight correctly (12:00 AM)", () => {
    const date = new Date(2024, 0, 1, 0, 0); // Jan 1, 2024 at 12:00 AM
    expect(formatTime(date)).toBe("12:00 AM");
  });

  it("should format noon correctly (12:00 PM)", () => {
    const date = new Date(2024, 0, 1, 12, 0); // Jan 1, 2024 at 12:00 PM
    expect(formatTime(date)).toBe("12:00 PM");
  });

  it("should handle single digit minutes with leading zero", () => {
    const date = new Date(2024, 0, 1, 8, 5); // Jan 1, 2024 at 8:05 AM
    expect(formatTime(date)).toBe("8:05 AM");
  });
});

describe("getCreatedAt", () => {
  it("should return Date when createdAt is a Date object", () => {
    const createdAt = new Date(2024, 0, 1, 10, 30);
    const message = createMockMessage([{ type: "text", text: "test" }]);
    (message as unknown as { createdAt: Date }).createdAt = createdAt;

    const result = getCreatedAt(message);
    expect(result).toEqual(createdAt);
  });

  it("should parse Date from createdAt string", () => {
    const dateString = "2024-01-01T10:30:00.000Z";
    const message = createMockMessage([{ type: "text", text: "test" }]);
    (message as unknown as { createdAt: string }).createdAt = dateString;

    const result = getCreatedAt(message);
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe(dateString);
  });

  it("should parse Date from createdAt number (timestamp)", () => {
    const timestamp = 1704106200000; // Jan 1, 2024 10:30 UTC
    const message = createMockMessage([{ type: "text", text: "test" }]);
    (message as unknown as { createdAt: number }).createdAt = timestamp;

    const result = getCreatedAt(message);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(timestamp);
  });

  it("should fallback to metadata.createdAt when direct property missing", () => {
    const createdAt = new Date(2024, 0, 1, 10, 30);
    const message = createMockMessage([{ type: "text", text: "test" }], {
      metadata: { createdAt },
    });

    const result = getCreatedAt(message);
    expect(result).toEqual(createdAt);
  });

  it("should parse metadata.createdAt string", () => {
    const dateString = "2024-01-01T10:30:00.000Z";
    const message = createMockMessage([{ type: "text", text: "test" }], {
      metadata: { createdAt: dateString },
    });

    const result = getCreatedAt(message);
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe(dateString);
  });

  it("should parse metadata.createdAt number", () => {
    const timestamp = 1704106200000;
    const message = createMockMessage([{ type: "text", text: "test" }], {
      metadata: { createdAt: timestamp },
    });

    const result = getCreatedAt(message);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(timestamp);
  });

  it("should return null when no timestamp available", () => {
    const message = createMockMessage([{ type: "text", text: "test" }]);
    const result = getCreatedAt(message);
    expect(result).toBeNull();
  });

  it("should return null when metadata exists but has no createdAt", () => {
    const message = createMockMessage([{ type: "text", text: "test" }], {
      metadata: { otherField: "value" },
    });
    const result = getCreatedAt(message);
    expect(result).toBeNull();
  });
});
