import { eq } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@sidekiq/shared/trpc/trpc";
import { user, type UserPreferences } from "@sidekiq/shared/db/schema";
import { updateModelPreferencesSchema } from "@sidekiq/user/validations";

/**
 * User router - User preferences and settings.
 */
export const userRouter = createTRPCRouter({
  /**
   * Get current user's preferences.
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.session.user.id),
      columns: { preferences: true },
    });

    return result?.preferences ?? {};
  }),

  /**
   * Update model preferences (default model, favorites).
   */
  updateModelPreferences: protectedProcedure
    .input(updateModelPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      // Get current preferences
      const current = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.session.user.id),
        columns: { preferences: true },
      });

      const currentPrefs = current?.preferences ?? {};
      const updatedPrefs: UserPreferences = { ...currentPrefs };

      // Update default model if provided
      if (input.defaultModel !== undefined) {
        updatedPrefs.defaultModel = input.defaultModel;
      }

      // Toggle favorite if provided
      if (input.toggleFavorite !== undefined) {
        const favorites = updatedPrefs.favoriteModels ?? [];
        const modelId = input.toggleFavorite;

        if (favorites.includes(modelId)) {
          updatedPrefs.favoriteModels = favorites.filter(
            (id) => id !== modelId,
          );
        } else {
          updatedPrefs.favoriteModels = [...favorites, modelId];
        }
      }

      // Save updated preferences
      await ctx.db
        .update(user)
        .set({ preferences: updatedPrefs, updatedAt: new Date() })
        .where(eq(user.id, ctx.session.user.id));

      return updatedPrefs;
    }),
});
