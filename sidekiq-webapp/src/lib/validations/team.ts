import { z } from "zod";
import { sidekiqAvatarSchema } from "./sidekiq";

/**
 * Re-export avatar schema for team use.
 * Teams use the same avatar system as Sidekiqs (initials/emoji + color).
 */
export const teamAvatarSchema = sidekiqAvatarSchema;

export type TeamAvatar = z.infer<typeof teamAvatarSchema>;

/**
 * Schema for creating a new team.
 */
export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be at most 100 characters"),
  avatar: sidekiqAvatarSchema.default({ type: "initials", color: "#6366f1" }),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

/**
 * Schema for updating an existing team.
 */
export const updateTeamSchema = z.object({
  id: z.string().min(1, "Team ID is required"),
  name: z.string().min(1).max(100).optional(),
  avatar: sidekiqAvatarSchema.optional(),
});

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

/**
 * Schema for deleting a team.
 */
export const deleteTeamSchema = z.object({
  id: z.string().min(1, "Team ID is required"),
});

export type DeleteTeamInput = z.infer<typeof deleteTeamSchema>;

/**
 * Schema for inviting a member to a team.
 * Email is transformed to lowercase for case-insensitive matching.
 */
export const inviteMemberSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  email: z
    .string()
    .email("Invalid email address")
    .transform((e) => e.toLowerCase()),
  sendEmail: z.boolean().default(true), // false = generate link only
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

/**
 * Schema for accepting an invite via token.
 */
export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

/**
 * Schema for revoking a pending invite.
 */
export const revokeInviteSchema = z.object({
  inviteId: z.string().min(1, "Invite ID is required"),
});

export type RevokeInviteInput = z.infer<typeof revokeInviteSchema>;

/**
 * Schema for resending an invite email.
 */
export const resendInviteSchema = z.object({
  inviteId: z.string().min(1, "Invite ID is required"),
});

export type ResendInviteInput = z.infer<typeof resendInviteSchema>;

/**
 * Schema for removing a member from a team.
 */
export const removeMemberSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

/**
 * Schema for changing a member's role.
 * Cannot change to owner via this schema (use transferOwnershipSchema).
 */
export const changeRoleSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  userId: z.string().min(1, "User ID is required"),
  newRole: z.enum(["admin", "member"]), // Cannot change to owner via this
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

/**
 * Schema for transferring team ownership.
 * Only the current owner can transfer ownership.
 */
export const transferOwnershipSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  newOwnerId: z.string().min(1, "New owner ID is required"),
});

export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;

/**
 * Schema for a member leaving a team.
 * Owners cannot leave (must transfer ownership first).
 */
export const leaveTeamSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
});

export type LeaveTeamInput = z.infer<typeof leaveTeamSchema>;

/**
 * Schema for fetching a single team by ID.
 */
export const getTeamByIdSchema = z.object({
  id: z.string().min(1, "Team ID is required"),
});

export type GetTeamByIdInput = z.infer<typeof getTeamByIdSchema>;
