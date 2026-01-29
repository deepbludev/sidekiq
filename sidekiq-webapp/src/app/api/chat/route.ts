import { streamText, convertToModelMessages } from "ai";
import type { UIMessage, ModelMessage } from "ai";
import { nanoid } from "nanoid";
import { and, eq, sql } from "drizzle-orm";

import { getModel } from "@sidekiq/ai/api/models";
import { generateThreadTitle } from "@sidekiq/ai/api/title";
import { chatRequestSchema } from "@sidekiq/chats/validations";
import { db } from "@sidekiq/shared/db";
import {
  messages,
  threads,
  sidekiqs,
  workspaces,
} from "@sidekiq/shared/db/schema";
import { getSession } from "@sidekiq/auth/api/server";
import { validateWorkspaceMembership } from "@sidekiq/shared/lib/workspace-auth";

/**
 * Extract text content from a UIMessage's parts.
 *
 * @param message - The UIMessage to extract text from
 * @returns Concatenated text content from all text parts
 */
function extractTextContent(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join("");
}

/**
 * POST /api/chat
 *
 * Streaming chat endpoint for AI conversations.
 * Handles thread creation, message persistence, token tracking, auto-title generation,
 * and Sidekiq system message injection.
 *
 * Request body:
 * - messages: Array of UIMessage objects from useChat hook
 * - threadId: Optional - ID of existing thread, or omit to create new thread
 * - model: Optional model ID (defaults to DEFAULT_MODEL)
 * - sidekiqId: Optional - ID of Sidekiq to associate with new thread
 *
 * Response:
 * - Server-Sent Events stream with AI response
 * - X-Thread-Id header when a new thread is created
 *
 * Sidekiq Integration:
 * - For new threads: sidekiqId from request body is stored in thread
 * - For existing threads: sidekiqId is loaded from thread record
 * - Sidekiq instructions are prepended as system message (NOT stored in DB)
 * - Sidekiq stats (lastUsedAt, threadCount) are updated on new thread creation
 *
 * Persistence:
 * - Thread is created atomically with first message (if threadId not provided)
 * - User message is saved immediately on request
 * - AI message is saved after stream completes (in onFinish)
 * - Thread lastActivityAt is updated after completion
 * - Auto-title is generated asynchronously after first AI response
 */
export async function POST(req: Request) {
  // 1. Validate session (authentication required)
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 1b. Resolve workspace from header
  const headerWorkspaceId = req.headers.get("x-workspace-id");
  let workspaceId: string;

  if (headerWorkspaceId) {
    const membership = await validateWorkspaceMembership(
      db,
      headerWorkspaceId,
      session.user.id,
    );
    if (!membership) {
      console.warn(
        `[Auth] Unauthorized workspace access in chat: userId=${session.user.id}, workspaceId=${headerWorkspaceId}, timestamp=${new Date().toISOString()}`,
      );
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    workspaceId = headerWorkspaceId;
  } else {
    // Fallback to personal workspace when no header (graceful degradation)
    const personalWs = await db.query.workspaces.findFirst({
      where: and(
        eq(workspaces.ownerId, session.user.id),
        eq(workspaces.type, "personal"),
      ),
      columns: { id: true },
    });
    if (!personalWs) {
      return new Response(
        JSON.stringify({ error: "Personal workspace not found" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    workspaceId = personalWs.id;
  }

  // 2. Parse and validate request body
  const body: unknown = await req.json();
  const parseResult = chatRequestSchema.safeParse(body);

  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: parseResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const {
    messages: uiMessages,
    threadId,
    model: modelId,
    sidekiqId,
  } = parseResult.data;

  // 2b. Verify sidekiq belongs to active workspace (security check)
  if (sidekiqId) {
    const sidekiqRecord = await db.query.sidekiqs.findFirst({
      where: eq(sidekiqs.id, sidekiqId),
      columns: { workspaceId: true },
    });

    if (!sidekiqRecord) {
      return new Response(JSON.stringify({ error: "Sidekiq not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (sidekiqRecord.workspaceId !== workspaceId) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 3. Handle thread: existing thread verification OR new thread creation
  type ThreadRecord = typeof threads.$inferSelect;
  let thread: ThreadRecord;
  let isNewThread = false;

  if (threadId) {
    // Existing thread - verify ownership
    const existingThread = await db.query.threads.findFirst({
      where: eq(threads.id, threadId),
    });

    if (!existingThread) {
      return new Response(JSON.stringify({ error: "Thread not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify thread belongs to the active workspace
    if (existingThread.workspaceId !== workspaceId) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify thread creator (user-level ownership within the workspace)
    if (existingThread.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Auto-unarchive if archived thread receives new message
    if (existingThread.isArchived) {
      await db
        .update(threads)
        .set({ isArchived: false, updatedAt: new Date() })
        .where(eq(threads.id, existingThread.id));
    }

    thread = existingThread;
  } else {
    // New thread - create atomically with first message
    isNewThread = true;
    const newThreadId = nanoid();

    // Use the workspace from the validated header (or personal workspace fallback)
    const [newThread] = await db
      .insert(threads)
      .values({
        id: newThreadId,
        userId: session.user.id,
        workspaceId, // Use resolved workspaceId instead of hardcoded personal lookup
        title: null, // Will be set after first AI response
        activeModel: modelId,
        sidekiqId: sidekiqId ?? null, // Associate with Sidekiq if provided
        lastActivityAt: new Date(),
      })
      .returning();

    if (!newThread) {
      return new Response(
        JSON.stringify({ error: "Failed to create thread" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    thread = newThread;

    // Update Sidekiq stats if thread was created with a Sidekiq
    if (sidekiqId) {
      await db
        .update(sidekiqs)
        .set({
          lastUsedAt: new Date(),
          threadCount: sql`${sidekiqs.threadCount} + 1`,
        })
        .where(eq(sidekiqs.id, sidekiqId));
    }
  }

  // 4. Validate last message is from user
  const userMessage = uiMessages[uiMessages.length - 1];
  if (userMessage?.role !== "user") {
    return new Response(
      JSON.stringify({ error: "Last message must be from user" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // 5. Save user message immediately
  const userMessageId = nanoid();
  await db.insert(messages).values({
    id: userMessageId,
    threadId: thread.id,
    role: "user",
    content: extractTextContent(userMessage as UIMessage),
    createdAt: new Date(),
  });

  // 6. Track start time for latency calculation
  const startTime = Date.now();

  // 7. Build messages with optional Sidekiq system message
  // For new threads: use sidekiqId from request body
  // For existing threads: use thread.sidekiqId from database
  const effectiveSidekiqId = isNewThread ? sidekiqId : thread.sidekiqId;
  let systemMessage: string | null = null;

  if (effectiveSidekiqId) {
    const sidekiq = await db.query.sidekiqs.findFirst({
      where: eq(sidekiqs.id, effectiveSidekiqId),
      columns: { instructions: true },
    });
    systemMessage = sidekiq?.instructions ?? null;
  }

  // Convert UI messages to model format
  const modelMessages = await convertToModelMessages(uiMessages as UIMessage[]);

  // Prepend system message if Sidekiq has instructions
  // System message is NOT stored in database - only injected at runtime
  // This ensures instruction updates apply to all future messages
  const messagesWithSystem: ModelMessage[] = systemMessage
    ? [{ role: "system" as const, content: systemMessage }, ...modelMessages]
    : modelMessages;

  // 8. Call streamText with the model and messages
  const result = streamText({
    model: getModel(modelId),
    messages: messagesWithSystem,
    abortSignal: req.signal,
  });

  // 9. CRITICAL: Call consumeStream() immediately to ensure persistence
  // even if client disconnects
  result.consumeStream();

  // 10. Build response headers - include X-Thread-Id for new threads
  const headers = new Headers();
  if (isNewThread) {
    headers.set("X-Thread-Id", thread.id);
  }

  // 11. Return streaming response with onFinish callback for persistence
  const streamResponse = result.toUIMessageStreamResponse({
    originalMessages: uiMessages as UIMessage[],
    generateMessageId: () => nanoid(),
    onFinish: async ({ responseMessage, isAborted, finishReason }) => {
      const latencyMs = Date.now() - startTime;

      // Get usage from the streamText result (this is a promise)
      const usage = await result.usage;

      // Extract text content from the response message
      const content = extractTextContent(responseMessage);

      // Insert assistant message to database
      await db.insert(messages).values({
        id: responseMessage.id,
        threadId: thread.id,
        role: "assistant",
        content,
        model: modelId,
        inputTokens: usage.inputTokens ?? null,
        outputTokens: usage.outputTokens ?? null,
        metadata: {
          finishReason: finishReason ?? null,
          latencyMs,
          aborted: isAborted,
        },
        createdAt: new Date(),
      });

      // Update thread lastActivityAt, messageCount, and activeModel
      await db
        .update(threads)
        .set({
          lastActivityAt: new Date(),
          messageCount: thread.messageCount + 2, // +1 user, +1 assistant
          activeModel: modelId,
        })
        .where(eq(threads.id, thread.id));

      // Generate title for new threads (fire-and-forget, non-blocking)
      if (isNewThread) {
        const userContent = extractTextContent(userMessage as UIMessage);
        const assistantContent = content;

        // Don't await - let it happen async to avoid blocking response
        generateThreadTitle(userContent, assistantContent)
          .then(async (title) => {
            await db
              .update(threads)
              .set({ title, updatedAt: new Date() })
              .where(eq(threads.id, thread.id));
          })
          .catch((err) => {
            console.error("[Auto-title] Failed:", err);
          });
      }
    },
  });

  // 12. Apply custom headers to the response
  if (isNewThread) {
    // Create new response with custom headers
    return new Response(streamResponse.body, {
      status: streamResponse.status,
      statusText: streamResponse.statusText,
      headers: {
        ...Object.fromEntries(streamResponse.headers.entries()),
        "X-Thread-Id": thread.id,
      },
    });
  }

  return streamResponse;
}
