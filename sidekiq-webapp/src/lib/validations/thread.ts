import { z } from "zod";

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
