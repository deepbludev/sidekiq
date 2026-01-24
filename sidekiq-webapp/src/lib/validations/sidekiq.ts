import { z } from "zod";

/**
 * Sidekiq avatar configuration.
 * Supports either text initials or emoji with customizable background color.
 */
export const sidekiqAvatarSchema = z.object({
  type: z.enum(["initials", "emoji"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  emoji: z.string().optional(),
});

export type SidekiqAvatar = z.infer<typeof sidekiqAvatarSchema>;

/**
 * Schema for creating a new Sidekiq.
 * Per CONTEXT.md limits: name 100 chars, description 500 chars, instructions 8000 chars.
 */
export const createSidekiqSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
  instructions: z
    .string()
    .max(8000, "Instructions must be at most 8000 characters"),
  conversationStarters: z
    .array(z.string().max(200, "Each starter must be at most 200 characters"))
    .max(6, "Maximum 6 conversation starters")
    .default([]),
  defaultModel: z.string().optional().nullable(),
  avatar: sidekiqAvatarSchema.default({ type: "initials", color: "#6366f1" }),
});

export type CreateSidekiqInput = z.infer<typeof createSidekiqSchema>;

/**
 * Schema for updating an existing Sidekiq.
 * All fields optional except id (uses partial of create schema).
 */
export const updateSidekiqSchema = z.object({
  id: z.string().min(1, "Sidekiq ID is required"),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  instructions: z.string().max(8000).optional(),
  conversationStarters: z.array(z.string().max(200)).max(6).optional(),
  defaultModel: z.string().optional().nullable(),
  avatar: sidekiqAvatarSchema.optional(),
});

export type UpdateSidekiqInput = z.infer<typeof updateSidekiqSchema>;

/**
 * Schema for deleting a Sidekiq.
 * Includes option to cascade delete associated threads.
 */
export const deleteSidekiqSchema = z.object({
  id: z.string().min(1, "Sidekiq ID is required"),
  deleteThreads: z.boolean().default(false),
});

export type DeleteSidekiqInput = z.infer<typeof deleteSidekiqSchema>;

/**
 * Schema for toggling favorite status.
 */
export const toggleFavoriteSchema = z.object({
  id: z.string().min(1, "Sidekiq ID is required"),
});

export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;

/**
 * Schema for duplicating a Sidekiq.
 */
export const duplicateSidekiqSchema = z.object({
  id: z.string().min(1, "Sidekiq ID is required"),
});

export type DuplicateSidekiqInput = z.infer<typeof duplicateSidekiqSchema>;

/**
 * Schema for listing sidekiqs with optional filters.
 */
export const listSidekiqsSchema = z
  .object({
    includeThreadCount: z.boolean().optional().default(true),
  })
  .optional();

export type ListSidekiqsInput = z.infer<typeof listSidekiqsSchema>;

/**
 * Schema for getting a single sidekiq by ID.
 */
export const getSidekiqByIdSchema = z.object({
  id: z.string().min(1, "Sidekiq ID is required"),
});

export type GetSidekiqByIdInput = z.infer<typeof getSidekiqByIdSchema>;
