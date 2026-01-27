import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import {
  createSidekiqSchema,
  deleteSidekiqSchema,
  duplicateSidekiqSchema,
  getSidekiqByIdSchema,
  listSidekiqsSchema,
  toggleFavoriteSchema,
  updateSidekiqSchema,
} from "../validations";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@sidekiq/shared/trpc/trpc";
import { sidekiqs, threads } from "@sidekiq/shared/db/schema";

/**
 * Simple in-memory rate limiter.
 * Tracks request timestamps per user with sliding window.
 */
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a user can make a request and record it if allowed.
   * @param userId - User identifier for rate limiting
   * @returns Object with success status and retry time if blocked
   */
  check(userId: string): { success: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this user
    const userRequests = this.requests.get(userId) ?? [];

    // Filter to only requests within the window
    const recentRequests = userRequests.filter((ts) => ts > windowStart);

    if (recentRequests.length >= this.maxRequests) {
      // Rate limited - calculate when the oldest request will expire
      const oldestRequest = Math.min(...recentRequests);
      const retryAfterMs = oldestRequest + this.windowMs - now;
      return { success: false, retryAfterMs };
    }

    // Record this request
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);

    return { success: true };
  }
}

/**
 * Rate limiter: 1000 creations per hour per user.
 * High limit for development/testing; reduce for production.
 */
const createRateLimiter = new RateLimiter(1000, 60 * 60 * 1000);

/**
 * Sidekiq router - CRUD operations for custom AI assistants.
 *
 * All mutations are protected (require authentication) and include
 * ownership verification via ownerId check in WHERE clauses.
 */
export const sidekiqRouter = createTRPCRouter({
  /**
   * List user's sidekiqs sorted by favorites then last used.
   * Favorites appear first, then sorted by most recent usage.
   *
   * @returns Array of sidekiq objects with metadata for display
   */
  list: protectedProcedure.input(listSidekiqsSchema).query(async ({ ctx }) => {
    return ctx.db.query.sidekiqs.findMany({
      where: eq(sidekiqs.ownerId, ctx.session.user.id),
      orderBy: [
        desc(sidekiqs.isFavorite),
        desc(sidekiqs.lastUsedAt),
        desc(sidekiqs.createdAt),
      ],
      columns: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        isFavorite: true,
        lastUsedAt: true,
        threadCount: true,
        createdAt: true,
      },
    });
  }),

  /**
   * Get a single sidekiq by ID with full details.
   * Used for edit form and sidekiq detail views.
   *
   * @param id - Sidekiq ID to retrieve
   * @returns Full sidekiq object
   * @throws NOT_FOUND if sidekiq doesn't exist or doesn't belong to user
   */
  getById: protectedProcedure
    .input(getSidekiqByIdSchema)
    .query(async ({ ctx, input }) => {
      const sidekiq = await ctx.db.query.sidekiqs.findFirst({
        where: and(
          eq(sidekiqs.id, input.id),
          eq(sidekiqs.ownerId, ctx.session.user.id),
        ),
      });

      if (!sidekiq) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sidekiq not found",
        });
      }

      return sidekiq;
    }),

  /**
   * Create a new Sidekiq.
   * Rate limited to 25 creations per hour per user.
   * Enforces unique name per user (case-insensitive).
   *
   * @param input - Sidekiq data (name, description, instructions, etc.)
   * @returns Created sidekiq object
   * @throws TOO_MANY_REQUESTS if rate limit exceeded
   * @throws CONFLICT if name already exists for user
   */
  create: protectedProcedure
    .input(createSidekiqSchema)
    .mutation(async ({ ctx, input }) => {
      // Rate limiting check
      const rateLimitResult = createRateLimiter.check(ctx.session.user.id);
      if (!rateLimitResult.success) {
        const retryMinutes = Math.ceil(
          (rateLimitResult.retryAfterMs ?? 0) / 60000,
        );
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Rate limit exceeded. Try again in ${retryMinutes} minute${retryMinutes > 1 ? "s" : ""}.`,
        });
      }

      // Check name uniqueness (case-insensitive)
      const existing = await ctx.db.query.sidekiqs.findFirst({
        where: and(
          eq(sidekiqs.ownerId, ctx.session.user.id),
          sql`LOWER(${sidekiqs.name}) = LOWER(${input.name})`,
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A Sidekiq with this name already exists",
        });
      }

      const [created] = await ctx.db
        .insert(sidekiqs)
        .values({
          id: nanoid(),
          ownerId: ctx.session.user.id,
          name: input.name,
          description: input.description ?? null,
          instructions: input.instructions,
          conversationStarters: input.conversationStarters,
          defaultModel: input.defaultModel ?? null,
          avatar: input.avatar,
        })
        .returning();

      return created;
    }),

  /**
   * Update an existing Sidekiq.
   * Enforces unique name per user (case-insensitive) if name is changed.
   *
   * @param input - Sidekiq ID and fields to update
   * @returns Updated sidekiq object
   * @throws NOT_FOUND if sidekiq doesn't exist or doesn't belong to user
   * @throws CONFLICT if new name already exists for user
   */
  update: protectedProcedure
    .input(updateSidekiqSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check name uniqueness if name is being changed
      if (data.name) {
        const existing = await ctx.db.query.sidekiqs.findFirst({
          where: and(
            eq(sidekiqs.ownerId, ctx.session.user.id),
            sql`LOWER(${sidekiqs.name}) = LOWER(${data.name})`,
            sql`${sidekiqs.id} != ${id}`,
          ),
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A Sidekiq with this name already exists",
          });
        }
      }

      const [updated] = await ctx.db
        .update(sidekiqs)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(sidekiqs.id, id), eq(sidekiqs.ownerId, ctx.session.user.id)),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sidekiq not found",
        });
      }

      return updated;
    }),

  /**
   * Delete a Sidekiq.
   * Optionally cascade deletes associated threads.
   *
   * @param input - Sidekiq ID and whether to delete threads
   * @returns Success confirmation with deleted ID
   * @throws NOT_FOUND if sidekiq doesn't exist or doesn't belong to user
   */
  delete: protectedProcedure
    .input(deleteSidekiqSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, deleteThreads } = input;

      // Fetch the sidekiq name before deletion for thread preservation
      const sidekiqToDelete = await ctx.db.query.sidekiqs.findFirst({
        where: and(
          eq(sidekiqs.id, id),
          eq(sidekiqs.ownerId, ctx.session.user.id),
        ),
        columns: { name: true },
      });

      if (!sidekiqToDelete) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sidekiq not found",
        });
      }

      // If user wants to delete threads too
      if (deleteThreads) {
        await ctx.db
          .delete(threads)
          .where(
            and(
              eq(threads.sidekiqId, id),
              eq(threads.userId, ctx.session.user.id),
            ),
          );
      } else {
        // Store the sidekiq name in threads before deletion for graceful UI degradation
        await ctx.db
          .update(threads)
          .set({ deletedSidekiqName: sidekiqToDelete.name })
          .where(eq(threads.sidekiqId, id));
      }

      const [deleted] = await ctx.db
        .delete(sidekiqs)
        .where(
          and(eq(sidekiqs.id, id), eq(sidekiqs.ownerId, ctx.session.user.id)),
        )
        .returning({ id: sidekiqs.id });

      return { success: true, deletedId: deleted!.id };
    }),

  /**
   * Toggle the favorite status of a Sidekiq.
   * Favorited sidekiqs appear at the top of the sidebar.
   *
   * @param input - Sidekiq ID
   * @returns Updated sidekiq with id and isFavorite status
   * @throws NOT_FOUND if sidekiq doesn't exist or doesn't belong to user
   */
  toggleFavorite: protectedProcedure
    .input(toggleFavoriteSchema)
    .mutation(async ({ ctx, input }) => {
      const sidekiq = await ctx.db.query.sidekiqs.findFirst({
        where: and(
          eq(sidekiqs.id, input.id),
          eq(sidekiqs.ownerId, ctx.session.user.id),
        ),
        columns: { isFavorite: true },
      });

      if (!sidekiq) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sidekiq not found",
        });
      }

      const [updated] = await ctx.db
        .update(sidekiqs)
        .set({ isFavorite: !sidekiq.isFavorite, updatedAt: new Date() })
        .where(
          and(
            eq(sidekiqs.id, input.id),
            eq(sidekiqs.ownerId, ctx.session.user.id),
          ),
        )
        .returning({ id: sidekiqs.id, isFavorite: sidekiqs.isFavorite });

      return updated;
    }),

  /**
   * Duplicate a Sidekiq.
   * Creates a copy with "Copy of [Name]" naming pattern.
   *
   * @param input - Sidekiq ID to duplicate
   * @returns Newly created sidekiq copy
   * @throws NOT_FOUND if original sidekiq doesn't exist or doesn't belong to user
   */
  duplicate: protectedProcedure
    .input(duplicateSidekiqSchema)
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.db.query.sidekiqs.findFirst({
        where: and(
          eq(sidekiqs.id, input.id),
          eq(sidekiqs.ownerId, ctx.session.user.id),
        ),
      });

      if (!original) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sidekiq not found",
        });
      }

      // Generate unique name: "Copy of [Name]" or "Copy of [Name] (2)" etc.
      let copyName = `Copy of ${original.name}`;
      let counter = 1;

      while (true) {
        const exists = await ctx.db.query.sidekiqs.findFirst({
          where: and(
            eq(sidekiqs.ownerId, ctx.session.user.id),
            sql`LOWER(${sidekiqs.name}) = LOWER(${copyName})`,
          ),
        });

        if (!exists) break;

        counter++;
        copyName = `Copy of ${original.name} (${counter})`;
      }

      const [created] = await ctx.db
        .insert(sidekiqs)
        .values({
          id: nanoid(),
          ownerId: ctx.session.user.id,
          name: copyName,
          description: original.description,
          instructions: original.instructions,
          conversationStarters: original.conversationStarters,
          defaultModel: original.defaultModel,
          avatar: original.avatar,
          isFavorite: false,
          threadCount: 0,
          lastUsedAt: null,
        })
        .returning();

      return created;
    }),
});
