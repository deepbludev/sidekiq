import { describe, expect, it, vi } from "vitest";

// Mock the gateway module to avoid server-only import
vi.mock("@sidekiq/lib/ai/gateway", () => ({
  gateway: vi.fn(),
}));

import { chatRequestSchema } from "@sidekiq/lib/validations/chat";
import { DEFAULT_MODEL } from "@sidekiq/lib/ai/models";

describe("chatRequestSchema", () => {
  describe("valid requests", () => {
    it("should accept valid request with all fields", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
            createdAt: new Date().toISOString(),
          },
        ],
        threadId: "thread-123",
        model: "anthropic/claude-sonnet-4-20250514",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("anthropic/claude-sonnet-4-20250514");
      }
    });

    it("should accept request without optional model and default to DEFAULT_MODEL", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe(DEFAULT_MODEL);
      }
    });

    it("should accept message with assistant role", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
          {
            id: "msg-2",
            role: "assistant",
            parts: [{ type: "text", text: "Hi there!" }],
          },
          {
            id: "msg-3",
            role: "user",
            parts: [{ type: "text", text: "How are you?" }],
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(true);
    });

    it("should accept message with system role", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "system",
            parts: [{ type: "text", text: "You are a helpful assistant." }],
          },
          {
            id: "msg-2",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(true);
    });

    it("should accept passthrough parts with any type field", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [
              { type: "text", text: "Hello" },
              { type: "tool-invocation", toolName: "calculator", args: {} },
              { type: "reasoning", text: "Thinking..." },
              { type: "source", url: "https://example.com" },
            ],
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(true);
    });

    it("should accept valid sidekiqId string", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
        threadId: "thread-123",
        sidekiqId: "sidekiq-abc123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sidekiqId).toBe("sidekiq-abc123");
      }
    });

    it("should accept request without sidekiqId (optional field)", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sidekiqId).toBeUndefined();
      }
    });

    it("should accept empty string sidekiqId", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
        threadId: "thread-123",
        sidekiqId: "",
      });

      // Empty string is valid - route handler may treat it as no sidekiq
      expect(result.success).toBe(true);
    });

    it("should coerce createdAt string to Date", () => {
      const dateString = "2024-01-15T10:30:00.000Z";
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
            createdAt: dateString,
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages[0]?.createdAt).toBeInstanceOf(Date);
      }
    });
  });

  describe("invalid requests", () => {
    it("should reject empty messages array", () => {
      const result = chatRequestSchema.safeParse({
        messages: [],
        threadId: "thread-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "At least one message is required",
        );
      }
    });

    it("should accept missing threadId (creates new thread)", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.threadId).toBeUndefined();
      }
    });

    it("should accept empty threadId (creates new thread)", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
        threadId: "",
      });

      // Empty string is valid - route handler will create new thread
      expect(result.success).toBe(true);
    });

    it("should reject message without id", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject message without role", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid role (not user/assistant/system)", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "admin",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const roleError = result.error.issues.find((issue) =>
          issue.path.includes("role"),
        );
        expect(roleError).toBeDefined();
      }
    });

    it("should reject message without parts", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject parts without type field", () => {
      const result = chatRequestSchema.safeParse({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ text: "Hello" }],
          },
        ],
        threadId: "thread-123",
      });

      expect(result.success).toBe(false);
    });
  });
});
