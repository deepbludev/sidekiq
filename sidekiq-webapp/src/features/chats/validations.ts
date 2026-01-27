import { z } from "zod";
import { DEFAULT_MODEL } from "@sidekiq/ai/api/models-metadata";

// ─── Thread Validation Schemas ───────────────────────────────────────────────

/**
 * Schema for thread ID validation.
 * Thread IDs are nanoid strings generated server-side.
 */
export const threadIdSchema = z.string().min(1, "Thread ID is required");

/**
 * Schema for thread title validation.
 * Title is displayed in sidebar and optionally in chat header.
 */
export const threadTitleSchema = z
  .string()
  .min(1, "Title cannot be empty")
  .max(255, "Title must be at most 255 characters");

/**
 * Input schema for deleting a thread.
 * Permanently removes the thread and all associated messages.
 */
export const deleteThreadInputSchema = z.object({
  threadId: threadIdSchema,
});

export type DeleteThreadInput = z.infer<typeof deleteThreadInputSchema>;

/**
 * Input schema for archiving a thread.
 * Soft-deletes the thread (sets isArchived = true).
 * Archived threads can be continued, which auto-unarchives them.
 */
export const archiveThreadInputSchema = z.object({
  threadId: threadIdSchema,
});

export type ArchiveThreadInput = z.infer<typeof archiveThreadInputSchema>;

/**
 * Input schema for unarchiving a thread.
 * Restores an archived thread to active state.
 */
export const unarchiveThreadInputSchema = z.object({
  threadId: threadIdSchema,
});

export type UnarchiveThreadInput = z.infer<typeof unarchiveThreadInputSchema>;

/**
 * Input schema for toggling thread pin status.
 * Pinned threads appear at the top of the sidebar.
 */
export const togglePinInputSchema = z.object({
  threadId: threadIdSchema,
});

export type TogglePinInput = z.infer<typeof togglePinInputSchema>;

/**
 * Input schema for renaming a thread.
 * Updates the thread title (editable via inline editing in sidebar).
 */
export const renameThreadInputSchema = z.object({
  threadId: threadIdSchema,
  title: threadTitleSchema,
});

export type RenameThreadInput = z.infer<typeof renameThreadInputSchema>;

/**
 * Input schema for listing threads.
 * Optional filter to include archived threads.
 */
export const listThreadsInputSchema = z
  .object({
    includeArchived: z.boolean().optional().default(false),
  })
  .optional();

export type ListThreadsInput = z.infer<typeof listThreadsInputSchema>;

/**
 * Input schema for getting a thread's title.
 * Used for polling title after async generation.
 */
export const getTitleInputSchema = z.object({
  threadId: threadIdSchema,
});

export type GetTitleInput = z.infer<typeof getTitleInputSchema>;

// ─── Chat Request Validation Schemas ─────────────────────────────────────────

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

  /**
   * Sidekiq ID to associate with this chat.
   * Only used when creating a new thread - ignored for existing threads
   * which already have sidekiqId stored in the database.
   */
  sidekiqId: z.string().optional(),
});

/**
 * Inferred TypeScript type for chat request body.
 */
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Inferred TypeScript type for UIMessage.
 */
export type UIMessageInput = z.infer<typeof uiMessageSchema>;
