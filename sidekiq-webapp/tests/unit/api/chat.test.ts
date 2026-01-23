import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";

/** Type for error response body */
interface ErrorResponse {
  error: string;
}

// Mock modules before importing the route handler
vi.mock("ai", () => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn(),
}));

vi.mock("@sidekiq/lib/ai/models", () => ({
  getModel: vi.fn(),
  DEFAULT_MODEL: "anthropic/claude-sonnet-4-20250514",
}));

vi.mock("@sidekiq/server/db", () => ({
  db: {
    query: {
      threads: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock("@sidekiq/server/better-auth/server", () => ({
  getSession: vi.fn(),
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "mock-nanoid"),
}));

// Import after mocks
import { POST } from "@sidekiq/app/api/chat/route";
import { streamText, convertToModelMessages } from "ai";
import { getModel } from "@sidekiq/lib/ai/models";
import { db } from "@sidekiq/server/db";
import { getSession } from "@sidekiq/server/better-auth/server";

/**
 * Helper to create a mock Request object
 */
function createMockRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Helper to create a valid chat request body
 */
function validChatBody(overrides = {}) {
  return {
    messages: [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
      },
    ],
    threadId: "thread-123",
    model: "anthropic/claude-sonnet-4-20250514",
    ...overrides,
  };
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mocks
    (getSession as Mock).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });
    (db.query.threads.findFirst as Mock).mockResolvedValue({
      id: "thread-123",
      userId: "user-123",
      messageCount: 0,
    });
    (convertToModelMessages as Mock).mockResolvedValue([
      { role: "user", content: "Hello" },
    ]);
    (getModel as Mock).mockReturnValue({ id: "mock-model" });

    // Mock streamText to return a valid response
    const mockResult = {
      consumeStream: vi.fn(),
      toUIMessageStreamResponse: vi.fn(
        () => new Response("stream", { status: 200 }),
      ),
      usage: Promise.resolve({ inputTokens: 10, outputTokens: 20 }),
    };
    (streamText as Mock).mockReturnValue(mockResult);

    // Mock db.insert chain
    (db.insert as Mock).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    // Mock db.update chain
    (db.update as Mock).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
  });

  describe("authentication", () => {
    it("should return 401 when no session", async () => {
      (getSession as Mock).mockResolvedValue(null);

      const req = createMockRequest(validChatBody());
      const res = await POST(req);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Unauthorized");
    });

    it("should return 401 when session has no user", async () => {
      (getSession as Mock).mockResolvedValue({ user: null });

      const req = createMockRequest(validChatBody());
      const res = await POST(req);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Unauthorized");
    });

    it("should proceed when valid session exists", async () => {
      const req = createMockRequest(validChatBody());
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(getSession).toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should return 400 for invalid request body", async () => {
      const req = createMockRequest({ invalid: true });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Invalid request");
    });

    it("should return 400 for missing threadId", async () => {
      const req = createMockRequest({
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("should return 400 for empty threadId", async () => {
      const req = createMockRequest(validChatBody({ threadId: "" }));
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("should return 400 when last message is not from user", async () => {
      const req = createMockRequest(
        validChatBody({
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
          ],
        }),
      );
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Last message must be from user");
    });
  });

  describe("thread authorization", () => {
    it("should return 404 when thread not found", async () => {
      (db.query.threads.findFirst as Mock).mockResolvedValue(null);

      const req = createMockRequest(validChatBody());
      const res = await POST(req);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Thread not found");
    });

    it("should return 403 when thread belongs to different user", async () => {
      (db.query.threads.findFirst as Mock).mockResolvedValue({
        id: "thread-123",
        userId: "other-user-456",
        messageCount: 0,
      });

      const req = createMockRequest(validChatBody());
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Unauthorized access to thread");
    });
  });

  describe("success path", () => {
    it("should call streamText with correct model", async () => {
      const req = createMockRequest(validChatBody());
      await POST(req);

      expect(getModel).toHaveBeenCalledWith(
        "anthropic/claude-sonnet-4-20250514",
      );
      expect(streamText).toHaveBeenCalled();

      const streamTextCall = (streamText as Mock).mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      expect(streamTextCall).toHaveProperty("model");
      expect(streamTextCall).toHaveProperty("messages");
    });

    it("should save user message immediately", async () => {
      const req = createMockRequest(validChatBody());
      await POST(req);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(db.insert).toHaveBeenCalled();
      const insertCall = (db.insert as Mock).mock.calls[0]?.[0] as unknown;
      // Verify messages table was passed to insert
      expect(insertCall).toBeDefined();
    });

    it("should return streaming response", async () => {
      const req = createMockRequest(validChatBody());
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it("should call consumeStream to ensure persistence on disconnect", async () => {
      const mockConsume = vi.fn();
      const mockResult = {
        consumeStream: mockConsume,
        toUIMessageStreamResponse: vi.fn(
          () => new Response("stream", { status: 200 }),
        ),
        usage: Promise.resolve({ inputTokens: 10, outputTokens: 20 }),
      };
      (streamText as Mock).mockReturnValue(mockResult);

      const req = createMockRequest(validChatBody());
      await POST(req);

      expect(mockConsume).toHaveBeenCalled();
    });

    it("should use default model when not specified", async () => {
      const body = validChatBody();
      delete (body as Record<string, unknown>).model;

      const req = createMockRequest(body);
      await POST(req);

      // Should use DEFAULT_MODEL from the schema default
      expect(getModel).toHaveBeenCalledWith(
        "anthropic/claude-sonnet-4-20250514",
      );
    });
  });
});
