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

vi.mock("@sidekiq/shared/lib/workspace-auth", () => ({
  validateWorkspaceMembership: vi.fn(),
}));

// Import after mocks
import { POST } from "@sidekiq/app/api/chat/route";
import { streamText, convertToModelMessages } from "ai";
import { getModel } from "@sidekiq/ai/api/models";
import { db } from "@sidekiq/shared/db";
import { getSession } from "@sidekiq/auth/api/server";
import { validateWorkspaceMembership } from "@sidekiq/shared/lib/workspace-auth";

/**
 * Helper to create a mock Request object with optional custom headers
 */
function createMockRequest(
  body: unknown,
  headers?: Record<string, string>,
): Request {
  const reqHeaders = new Headers({ "Content-Type": "application/json" });
  if (headers) {
    Object.entries(headers).forEach(([k, v]) => reqHeaders.set(k, v));
  }
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: reqHeaders,
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
      workspaceId: "personal-workspace-123",
      messageCount: 0,
    });
    (convertToModelMessages as Mock).mockResolvedValue([
      { role: "user", content: "Hello" },
    ]);
    (getModel as Mock).mockReturnValue({ id: "mock-model" });

    // Default sidekiq mock - in current workspace
    (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
      workspaceId: "personal-workspace-123",
      instructions: null,
    });

    // Default workspace mock - user's personal workspace (used when no header)
    (db.query.workspaces.findFirst as Mock).mockResolvedValue({
      id: "personal-workspace-123",
    });

    // Default workspace membership mock - valid membership
    (validateWorkspaceMembership as Mock).mockResolvedValue({
      role: "owner",
      workspaceType: "personal",
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
      const req = createMockRequest(validChatBody(), {
        "x-workspace-id": "personal-workspace-123",
      });
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

      // Should succeed and create a new thread (falls back to personal workspace)
      expect(res.status).toBe(200);
    });

    it("should create new thread when threadId is empty", async () => {
      const req = createMockRequest(validChatBody({ threadId: "" }));
      const res = await POST(req);

      // Should succeed and create a new thread (falls back to personal workspace)
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
        { "x-workspace-id": "personal-workspace-123" },
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

      const req = createMockRequest(validChatBody(), {
        "x-workspace-id": "personal-workspace-123",
      });
      const res = await POST(req);

      expect(res.status).toBe(404);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Thread not found");
    });

    it("should return 403 when thread belongs to different user", async () => {
      (db.query.threads.findFirst as Mock).mockResolvedValue({
        id: "thread-123",
        userId: "other-user-456",
        workspaceId: "personal-workspace-123",
        messageCount: 0,
      });

      const req = createMockRequest(validChatBody(), {
        "x-workspace-id": "personal-workspace-123",
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Access denied");
    });
  });

  describe("success path", () => {
    it("should call streamText with correct model", async () => {
      const req = createMockRequest(validChatBody(), {
        "x-workspace-id": "personal-workspace-123",
      });
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
      const req = createMockRequest(validChatBody(), {
        "x-workspace-id": "personal-workspace-123",
      });
      await POST(req);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(db.insert).toHaveBeenCalled();
      const insertCall = (db.insert as Mock).mock.calls[0]?.[0] as unknown;
      // Verify messages table was passed to insert
      expect(insertCall).toBeDefined();
    });

    it("should return streaming response", async () => {
      const req = createMockRequest(validChatBody(), {
        "x-workspace-id": "personal-workspace-123",
      });
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

      const req = createMockRequest(validChatBody(), {
        "x-workspace-id": "personal-workspace-123",
      });
      await POST(req);

      expect(mockConsume).toHaveBeenCalled();
    });

    it("should use default model when not specified", async () => {
      const body = validChatBody();
      delete (body as Record<string, unknown>).model;

      const req = createMockRequest(body, {
        "x-workspace-id": "personal-workspace-123",
      });
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

    it("should return 403 when sidekiq belongs to different workspace", async () => {
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
        workspaceId: "other-workspace-456",
        instructions: null,
      });

      // No header -> falls back to personal workspace "personal-workspace-123"
      // sidekiq.workspaceId "other-workspace-456" !== "personal-workspace-123" -> 403
      const req = createMockRequest(
        validChatBody({ sidekiqId: "sidekiq-123", threadId: undefined }),
      );
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Access denied");
    });

    it("should proceed when valid sidekiqId in same workspace", async () => {
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
        workspaceId: "personal-workspace-123",
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
      // Mock sidekiq with instructions (first call for authorization, second for system message)
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
        workspaceId: "personal-workspace-123",
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
        workspaceId: "personal-workspace-123",
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
        workspaceId: "personal-workspace-123",
        messageCount: 2,
        sidekiqId: "thread-sidekiq-456",
      });

      // Mock sidekiq for the thread's sidekiqId
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
        workspaceId: "personal-workspace-123",
        instructions: "You are a thread-specific assistant.",
      });

      // Request WITHOUT sidekiqId (existing thread should use its own)
      const req = createMockRequest(
        validChatBody({ threadId: "thread-123", sidekiqId: undefined }),
        { "x-workspace-id": "personal-workspace-123" },
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

      // No header -> falls back to personal workspace lookup -> returns null -> 500
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

    it("should not look up personal workspace for existing threads with workspace header", async () => {
      // Clear mock call history after beforeEach
      (db.query.workspaces.findFirst as Mock).mockClear();

      // With x-workspace-id header, the route uses validateWorkspaceMembership
      // and does NOT call db.query.workspaces.findFirst
      const req = createMockRequest(validChatBody(), {
        "x-workspace-id": "personal-workspace-123",
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(db.query.workspaces.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("workspace authorization", () => {
    it("should return 403 when x-workspace-id header is invalid (not a member)", async () => {
      (validateWorkspaceMembership as Mock).mockResolvedValue(null);

      const req = createMockRequest(validChatBody(), {
        "x-workspace-id": "invalid-workspace",
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Access denied");
    });

    it("should use workspace from x-workspace-id header when membership is valid", async () => {
      (validateWorkspaceMembership as Mock).mockResolvedValue({
        role: "member",
        workspaceType: "team",
      });
      // No sidekiq
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue(null);

      const req = createMockRequest(
        validChatBody({ threadId: undefined, sidekiqId: undefined }),
        { "x-workspace-id": "team-workspace-456" },
      );
      const res = await POST(req);

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(db.insert).toHaveBeenCalled();
    });

    it("should return 403 when existing thread workspace does not match active workspace", async () => {
      (validateWorkspaceMembership as Mock).mockResolvedValue({
        role: "owner",
        workspaceType: "personal",
      });
      (db.query.threads.findFirst as Mock).mockResolvedValue({
        id: "thread-123",
        userId: "user-123",
        workspaceId: "other-workspace-789",
        messageCount: 0,
      });

      const req = createMockRequest(validChatBody(), {
        "x-workspace-id": "personal-workspace-123",
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Access denied");
    });

    it("should return 403 when sidekiq workspace does not match active workspace", async () => {
      (validateWorkspaceMembership as Mock).mockResolvedValue({
        role: "owner",
        workspaceType: "personal",
      });
      (db.query.sidekiqs.findFirst as Mock).mockResolvedValue({
        workspaceId: "different-workspace-999",
      });

      const req = createMockRequest(
        validChatBody({
          sidekiqId: "sidekiq-123",
          threadId: undefined,
        }),
        { "x-workspace-id": "personal-workspace-123" },
      );
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("Access denied");
    });
  });
});
