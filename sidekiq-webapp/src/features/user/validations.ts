import { z } from "zod";

/**
 * Schema for updating user model preferences.
 */
export const updateModelPreferencesSchema = z.object({
  /** Set as user's default model for new threads */
  defaultModel: z.string().optional(),
  /** Toggle a model's favorite status */
  toggleFavorite: z.string().optional(),
});

export type UpdateModelPreferencesInput = z.infer<
  typeof updateModelPreferencesSchema
>;
