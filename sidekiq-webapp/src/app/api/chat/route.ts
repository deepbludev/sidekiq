import { streamText, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

import { getModel } from "@sidekiq/lib/ai/models";
import { generateThreadTitle } from "@sidekiq/lib/ai/title";
import { chatRequestSchema } from "@sidekiq/lib/validations/chat";
import { db } from "@sidekiq/server/db";
import { messages, threads } from "@sidekiq/server/db/schema";
import { getSession } from "@sidekiq/server/better-auth/server";

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
 * Handles thread creation, message persistence, token tracking, and auto-title generation.
 *
 * Request body:
 * - messages: Array of UIMessage objects from useChat hook
 * - threadId: Optional - ID of existing thread, or omit to create new thread
 * - model: Optional model ID (defaults to DEFAULT_MODEL)
 *
 * Response:
 * - Server-Sent Events stream with AI response
 * - X-Thread-Id header when a new thread is created
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

  const { messages: uiMessages, threadId, model: modelId } = parseResult.data;

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

    if (existingThread.userId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access to thread" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
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
    const [newThread] = await db
      .insert(threads)
      .values({
        id: newThreadId,
        userId: session.user.id,
        title: null, // Will be set after first AI response
        activeModel: modelId,
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

  // 7. Call streamText with the model and messages
  const result = streamText({
    model: getModel(modelId),
    messages: await convertToModelMessages(uiMessages as UIMessage[]),
    abortSignal: req.signal,
  });

  // 8. CRITICAL: Call consumeStream() immediately to ensure persistence
  // even if client disconnects
  result.consumeStream();

  // 9. Build response headers - include X-Thread-Id for new threads
  const headers = new Headers();
  if (isNewThread) {
    headers.set("X-Thread-Id", thread.id);
  }

  // 10. Return streaming response with onFinish callback for persistence
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

  // 11. Apply custom headers to the response
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
