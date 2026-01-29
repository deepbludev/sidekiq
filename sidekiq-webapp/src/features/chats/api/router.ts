import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";

import {
  createTRPCRouter,
  workspaceProcedure,
} from "@sidekiq/shared/trpc/trpc";
import { threads } from "@sidekiq/shared/db/schema";
import {
  deleteThreadInputSchema,
  archiveThreadInputSchema,
  unarchiveThreadInputSchema,
  togglePinInputSchema,
  renameThreadInputSchema,
  listThreadsInputSchema,
  getTitleInputSchema,
} from "../validations";

/**
 * Thread router - CRUD operations for conversation threads.
 *
 * All procedures are workspace-scoped via workspaceProcedure, ensuring data
 * isolation per workspace. Queries filter by workspaceId so team members see
 * all workspace threads. Mutations additionally verify userId to ensure only
 * the thread creator can modify their threads.
 */
export const threadRouter = createTRPCRouter({
  /**
   * Get thread title by ID.
   * Used for polling title after async generation.
   *
   * @param threadId - ID of the thread to get title for
   * @returns Object with title (string or null)
   */
  getTitle: workspaceProcedure
    .input(getTitleInputSchema)
    .query(async ({ ctx, input }) => {
      const thread = await ctx.db.query.threads.findFirst({
        where: and(
          eq(threads.id, input.threadId),
          eq(threads.workspaceId, ctx.workspaceId),
        ),
        columns: { title: true },
      });

      return { title: thread?.title ?? null };
    }),

  /**
   * List user's threads sorted by pinned status then last activity.
   * Pinned threads appear first, then sorted by most recent activity.
   * Includes Sidekiq relation data for sidebar display (avatar, name).
   *
   * @param includeArchived - Whether to include archived threads (default: false)
   * @returns Array of thread objects with metadata and optional sidekiq relation
   */
  list: workspaceProcedure
    .input(listThreadsInputSchema)
    .query(async ({ ctx, input }) => {
      const includeArchived = input?.includeArchived ?? false;

      const result = await ctx.db.query.threads.findMany({
        where: includeArchived
          ? eq(threads.workspaceId, ctx.workspaceId)
          : and(
              eq(threads.workspaceId, ctx.workspaceId),
              eq(threads.isArchived, false),
            ),
        orderBy: [desc(threads.isPinned), desc(threads.lastActivityAt)],
        columns: {
          id: true,
          title: true,
          isPinned: true,
          isArchived: true,
          lastActivityAt: true,
          messageCount: true,
          sidekiqId: true,
          deletedSidekiqName: true,
        },
        with: {
          sidekiq: {
            columns: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return result;
    }),

  /**
   * Permanently delete a thread and all associated messages.
   * Verifies ownership before deletion.
   *
   * @param threadId - ID of the thread to delete
   * @returns Success confirmation with deleted ID
   * @throws NOT_FOUND if thread doesn't exist or doesn't belong to user
   */
  delete: workspaceProcedure
    .input(deleteThreadInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(threads)
        .where(
          and(
            eq(threads.id, input.threadId),
            eq(threads.workspaceId, ctx.workspaceId),
            eq(threads.userId, ctx.session.user.id),
          ),
        )
        .returning({ id: threads.id });

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found or access denied",
        });
      }

      return { success: true, deletedId: deleted.id };
    }),

  /**
   * Archive a thread (soft-delete).
   * Sets isArchived = true, thread can be restored later.
   *
   * @param threadId - ID of the thread to archive
   * @returns Updated thread with id and isArchived status
   * @throws NOT_FOUND if thread doesn't exist or doesn't belong to user
   */
  archive: workspaceProcedure
    .input(archiveThreadInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(threads)
        .set({
          isArchived: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(threads.id, input.threadId),
            eq(threads.workspaceId, ctx.workspaceId),
            eq(threads.userId, ctx.session.user.id),
          ),
        )
        .returning({ id: threads.id, isArchived: threads.isArchived });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found or access denied",
        });
      }

      return updated;
    }),

  /**
   * Unarchive a thread (restore from archive).
   * Sets isArchived = false.
   *
   * @param threadId - ID of the thread to unarchive
   * @returns Updated thread with id and isArchived status
   * @throws NOT_FOUND if thread doesn't exist or doesn't belong to user
   */
  unarchive: workspaceProcedure
    .input(unarchiveThreadInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(threads)
        .set({
          isArchived: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(threads.id, input.threadId),
            eq(threads.workspaceId, ctx.workspaceId),
            eq(threads.userId, ctx.session.user.id),
          ),
        )
        .returning({ id: threads.id, isArchived: threads.isArchived });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found or access denied",
        });
      }

      return updated;
    }),

  /**
   * Toggle the pinned status of a thread.
   * Pinned threads appear at the top of the sidebar.
   *
   * @param threadId - ID of the thread to toggle pin
   * @returns Updated thread with id and isPinned status
   * @throws NOT_FOUND if thread doesn't exist or doesn't belong to user
   */
  togglePin: workspaceProcedure
    .input(togglePinInputSchema)
    .mutation(async ({ ctx, input }) => {
      // First, get the current pin status
      const thread = await ctx.db.query.threads.findFirst({
        where: and(
          eq(threads.id, input.threadId),
          eq(threads.workspaceId, ctx.workspaceId),
          eq(threads.userId, ctx.session.user.id),
        ),
        columns: { isPinned: true },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found or access denied",
        });
      }

      // Toggle the pin status
      const [updated] = await ctx.db
        .update(threads)
        .set({
          isPinned: !thread.isPinned,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(threads.id, input.threadId),
            eq(threads.workspaceId, ctx.workspaceId),
            eq(threads.userId, ctx.session.user.id),
          ),
        )
        .returning({ id: threads.id, isPinned: threads.isPinned });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found or access denied",
        });
      }

      return updated;
    }),

  /**
   * Rename a thread by updating its title.
   *
   * @param threadId - ID of the thread to rename
   * @param title - New title (1-255 characters)
   * @returns Updated thread with id and title
   * @throws NOT_FOUND if thread doesn't exist or doesn't belong to user
   */
  rename: workspaceProcedure
    .input(renameThreadInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(threads)
        .set({
          title: input.title,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(threads.id, input.threadId),
            eq(threads.workspaceId, ctx.workspaceId),
            eq(threads.userId, ctx.session.user.id),
          ),
        )
        .returning({ id: threads.id, title: threads.title });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found or access denied",
        });
      }

      return updated;
    }),
});
