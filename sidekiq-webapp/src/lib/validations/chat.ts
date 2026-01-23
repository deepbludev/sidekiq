import { DEFAULT_MODEL } from "@sidekiq/lib/ai/models";
import { z } from "zod";

/**
 * Schema for message parts in the AI SDK UIMessage format.
 * Uses passthrough to handle all AI SDK part types without strict validation.
 * The AI SDK can return many part types (text, tool-invocation, reasoning, source, etc.)
 * and we need to forward them all correctly.
 */
const messagePartSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

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
   * Optional - if not provided, a new thread will be created on first message.
   */
  threadId: z.string().optional(),

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
