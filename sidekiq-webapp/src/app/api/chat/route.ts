import { streamText, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

import { getModel } from "@sidekiq/lib/ai/models";
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
      (part): part is { type: "text"; text: string } => part.type === "text"
    )
    .map((part) => part.text)
    .join("");
}

/**
 * POST /api/chat
 *
 * Streaming chat endpoint for AI conversations.
 * Handles message persistence and token tracking.
 *
 * Request body:
 * - messages: Array of UIMessage objects from useChat hook
 * - threadId: ID of the thread to save messages to
 * - model: Optional model ID (defaults to DEFAULT_MODEL)
 *
 * Response:
 * - Server-Sent Events stream with AI response
 *
 * Persistence:
 * - User message is saved immediately on request
 * - AI message is saved after stream completes (in onFinish)
 * - Thread lastActivityAt is updated after completion
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
      }
    );
  }

  const { messages: uiMessages, threadId, model: modelId } = parseResult.data;

  // Verify thread exists and belongs to user
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });

  if (!thread) {
    return new Response(JSON.stringify({ error: "Thread not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (thread.userId !== session.user.id) {
    return new Response(
      JSON.stringify({ error: "Unauthorized access to thread" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Save user message immediately
  const userMessage = uiMessages[uiMessages.length - 1];
  if (userMessage?.role !== "user") {
    return new Response(
      JSON.stringify({ error: "Last message must be from user" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const userMessageId = nanoid();
  await db.insert(messages).values({
    id: userMessageId,
    threadId,
    role: "user",
    content: extractTextContent(userMessage as UIMessage),
    createdAt: new Date(),
  });

  // 4. Track start time for latency calculation
  const startTime = Date.now();

  // 5. Call streamText with the model and messages
  const result = streamText({
    model: getModel(modelId),
    messages: await convertToModelMessages(uiMessages as UIMessage[]),
    abortSignal: req.signal,
  });

  // 6. CRITICAL: Call consumeStream() immediately to ensure persistence
  // even if client disconnects
  result.consumeStream();

  // 7. Return streaming response with onFinish callback for persistence
  return result.toUIMessageStreamResponse({
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
        threadId,
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

      // Update thread lastActivityAt and increment message count
      await db
        .update(threads)
        .set({
          lastActivityAt: new Date(),
          messageCount: thread.messageCount + 2, // +1 user, +1 assistant
        })
        .where(eq(threads.id, threadId));
    },
  });
}
