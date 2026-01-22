import { z } from "zod";
import { DEFAULT_MODEL } from "@sidekiq/lib/ai/models";

/**
 * Schema for message parts in the AI SDK UIMessage format.
 * Supports text parts for now, can be extended for tool results, images, etc.
 */
const messagePartSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  // Extensible for future part types (tool-invocation, tool-result, image, etc.)
  z.object({
    type: z.literal("tool-invocation"),
    toolInvocationId: z.string(),
    toolName: z.string(),
    args: z.record(z.unknown()),
    state: z.enum(["pending", "result", "error"]),
    result: z.unknown().optional(),
  }),
]);

/**
 * Schema for UIMessage format as used by the Vercel AI SDK.
 * This is the format sent by useChat hook on the client.
 */
const uiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(messagePartSchema),
  createdAt: z.coerce.date().optional(),
});

/**
 * Request schema for the /api/chat endpoint.
 * Validates incoming chat requests from useChat hook.
 */
export const chatRequestSchema = z.object({
  /**
   * Array of messages in UIMessage format from the AI SDK.
   * The last message is the new user message to process.
   */
  messages: z.array(uiMessageSchema).min(1, "At least one message is required"),

  /**
   * Thread ID for the conversation.
   * Required to persist messages to the correct thread.
   */
  threadId: z.string().min(1, "Thread ID is required"),

  /**
   * Model to use for generation.
   * Defaults to the application's default model if not specified.
   */
  model: z.string().optional().default(DEFAULT_MODEL),
});

/**
 * Inferred TypeScript type for chat request body.
 */
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Inferred TypeScript type for UIMessage.
 */
export type UIMessageInput = z.infer<typeof uiMessageSchema>;
