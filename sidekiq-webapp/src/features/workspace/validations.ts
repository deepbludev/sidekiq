import { z } from "zod";
import { sidekiqAvatarSchema } from "@sidekiq/sidekiqs/validations";

/**
 * Re-export avatar schema for workspace use.
 * Workspaces use the same avatar system as Sidekiqs (initials/emoji + color).
 */
export const workspaceAvatarSchema = sidekiqAvatarSchema;

export type WorkspaceAvatar = z.infer<typeof workspaceAvatarSchema>;

/**
 * Schema for creating a new workspace.
 */
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name must be at most 100 characters"),
  avatar: sidekiqAvatarSchema.default({ type: "initials", color: "#6366f1" }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

/**
 * Schema for updating an existing workspace.
 */
export const updateWorkspaceSchema = z.object({
  id: z.string().min(1, "Workspace ID is required"),
  name: z.string().min(1).max(100).optional(),
  avatar: sidekiqAvatarSchema.optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

/**
 * Schema for deleting a workspace.
 */
export const deleteWorkspaceSchema = z.object({
  id: z.string().min(1, "Workspace ID is required"),
});

export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceSchema>;

/**
 * Schema for inviting a member to a workspace.
 * Email is transformed to lowercase for case-insensitive matching.
 */
export const inviteMemberSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
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
 * Schema for removing a member from a workspace.
 */
export const removeMemberSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

/**
 * Schema for changing a member's role.
 * Cannot change to owner via this schema (use transferOwnershipSchema).
 */
export const changeRoleSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  userId: z.string().min(1, "User ID is required"),
  newRole: z.enum(["admin", "member"]), // Cannot change to owner via this
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

/**
 * Schema for transferring workspace ownership.
 * Only the current owner can transfer ownership.
 */
export const transferOwnershipSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  newOwnerId: z.string().min(1, "New owner ID is required"),
});

export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;

/**
 * Schema for a member leaving a workspace.
 * Owners cannot leave (must transfer ownership first).
 */
export const leaveWorkspaceSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export type LeaveWorkspaceInput = z.infer<typeof leaveWorkspaceSchema>;

/**
 * Schema for fetching a single workspace by ID.
 */
export const getWorkspaceByIdSchema = z.object({
  id: z.string().min(1, "Workspace ID is required"),
});

export type GetWorkspaceByIdInput = z.infer<typeof getWorkspaceByIdSchema>;
