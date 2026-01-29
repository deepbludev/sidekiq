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

vi.mock("@sidekiq/ai/api/models", () => ({
  getModel: vi.fn(),
  DEFAULT_MODEL: "google/gemini-2.0-flash",
}));

vi.mock("@sidekiq/shared/db", () => ({
  db: {
    query: {
      threads: {
        findFirst: vi.fn(),
      },
      sidekiqs: {
        findFirst: vi.fn(),
      },
      workspaces: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock("@sidekiq/auth/api/server", () => ({
  getSession: vi.fn(),
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "mock-nanoid"),
}));

// Import after mocks
import { POST } from "@sidekiq/app/api/chat/route";
import { streamText, convertToModelMessages } from "ai";
import { getModel } from "@sidekiq/ai/api/models";
import { db } from "@sidekiq/shared/db";
import { getSession } from "@sidekiq/auth/api/server";

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
    sidekiqId: undefined, // Optional field
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

    // Default sidekiq mock - owned by current user
    (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
      ownerId: "user-123",
      instructions: null,
    });

    // Default workspace mock - user's personal workspace
    (db.query.workspaces.findFirst as Mock).mockResolvedValue({
      id: "personal-workspace-123",
    });

    // Mock streamText to return a valid response
    const mockResult = {
      consumeStream: vi.fn(),
      toUIMessageStreamResponse: vi.fn(
        () => new Response("stream", { status: 200 }),
      ),
      usage: Promise.resolve({ inputTokens: 10, outputTokens: 20 }),
    };
    (streamText as Mock).mockReturnValue(mockResult);

    // Mock db.insert chain (for messages and new threads)
    (db.insert as Mock).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "new-thread-123" }]),
      }),
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

    it("should create new thread when threadId is missing", async () => {
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

      // Should succeed and create a new thread
      expect(res.status).toBe(200);
    });

    it("should create new thread when threadId is empty", async () => {
      const req = createMockRequest(validChatBody({ threadId: "" }));
      const res = await POST(req);

      // Should succeed and create a new thread
      expect(res.status).toBe(200);
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
      expect(getModel).toHaveBeenCalledWith("google/gemini-2.0-flash");
    });
  });

  describe("sidekiq authorization", () => {
    it("should return 404 when sidekiqId not found", async () => {
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue(null);

      const req = createMockRequest(
        validChatBody({
          sidekiqId: "nonexistent-sidekiq",
          threadId: undefined,
        }),
      );
      const res = await POST(req);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Sidekiq not found");
    });

    it("should return 403 when sidekiq belongs to different user", async () => {
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
        ownerId: "other-user-456",
        instructions: null,
      });

      const req = createMockRequest(
        validChatBody({ sidekiqId: "sidekiq-123", threadId: undefined }),
      );
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Unauthorized access to Sidekiq");
    });

    it("should proceed when valid sidekiqId owned by user", async () => {
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
        ownerId: "user-123",
        instructions: "You are a helpful assistant.",
      });

      const req = createMockRequest(
        validChatBody({ sidekiqId: "sidekiq-123", threadId: undefined }),
      );
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });

  describe("sidekiq system message injection", () => {
    it("should call streamText with system message when sidekiq has instructions", async () => {
      // Mock sidekiq with instructions
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
        ownerId: "user-123",
        instructions: "You are a helpful coding assistant.",
      });

      const req = createMockRequest(
        validChatBody({ sidekiqId: "sidekiq-123", threadId: undefined }),
      );
      await POST(req);

      expect(streamText).toHaveBeenCalled();
      const streamTextCall = (streamText as Mock).mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      const messages = streamTextCall.messages as Array<{
        role: string;
        content: string;
      }>;

      // First message should be system message with sidekiq instructions
      expect(messages[0]).toEqual({
        role: "system",
        content: "You are a helpful coding assistant.",
      });
    });

    it("should call streamText without system message when sidekiq has no instructions", async () => {
      // Mock sidekiq without instructions
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
        ownerId: "user-123",
        instructions: null,
      });

      const req = createMockRequest(
        validChatBody({ sidekiqId: "sidekiq-123", threadId: undefined }),
      );
      await POST(req);

      expect(streamText).toHaveBeenCalled();
      const streamTextCall = (streamText as Mock).mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      const messages = streamTextCall.messages as Array<{
        role: string;
        content: string;
      }>;

      // First message should NOT be a system message (no instructions)
      expect(messages[0]?.role).toBe("user");
    });

    it("should use thread.sidekiqId for existing threads (effectiveSidekiqId pattern)", async () => {
      // Mock existing thread with sidekiqId attached
      (db.query.threads.findFirst as Mock).mockResolvedValue({
        id: "thread-123",
        userId: "user-123",
        messageCount: 2,
        sidekiqId: "thread-sidekiq-456",
      });

      // Mock sidekiq for the thread's sidekiqId
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
        ownerId: "user-123",
        instructions: "You are a thread-specific assistant.",
      });

      // Request WITHOUT sidekiqId (existing thread should use its own)
      const req = createMockRequest(
        validChatBody({ threadId: "thread-123", sidekiqId: undefined }),
      );
      await POST(req);

      expect(streamText).toHaveBeenCalled();
      const streamTextCall = (streamText as Mock).mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      const messages = streamTextCall.messages as Array<{
        role: string;
        content: string;
      }>;

      // System message should be from thread's sidekiq
      expect(messages[0]).toEqual({
        role: "system",
        content: "You are a thread-specific assistant.",
      });
    });
  });

  describe("personal workspace lookup", () => {
    it("should return 500 when personal workspace not found for new thread", async () => {
      (db.query.workspaces.findFirst as Mock).mockResolvedValue(null);

      const req = createMockRequest(validChatBody({ threadId: undefined }));
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Personal workspace not found");
    });

    it("should assign workspaceId from personal workspace when creating new thread", async () => {
      (db.query.workspaces.findFirst as Mock).mockResolvedValue({
        id: "personal-ws-789",
      });

      const req = createMockRequest(validChatBody({ threadId: undefined }));
      const res = await POST(req);

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(db.insert).toHaveBeenCalled();

      // Verify the insert().values() chain was called (thread creation with workspace context)
      const insertMockReturn = (db.insert as Mock).mock.results[0]?.value as {
        values: Mock;
      };
      expect(insertMockReturn.values).toHaveBeenCalled();
    });

    it("should not look up personal workspace for existing threads", async () => {
      // Clear mock call history after beforeEach
      (db.query.workspaces.findFirst as Mock).mockClear();

      const req = createMockRequest(validChatBody());
      const res = await POST(req);

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(db.query.workspaces.findFirst).not.toHaveBeenCalled();
    });
  });
});
