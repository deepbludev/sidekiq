import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { addDays } from "date-fns";

import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  deleteWorkspaceSchema,
  getWorkspaceByIdSchema,
  inviteMemberSchema,
  acceptInviteSchema,
  revokeInviteSchema,
  resendInviteSchema,
  removeMemberSchema,
  changeRoleSchema,
  transferOwnershipSchema,
  leaveWorkspaceSchema,
} from "@sidekiq/workspace/validations";
import {
  canInvite,
  canRemoveMember,
  canChangeRole,
  canTransferOwnership,
  canDeleteWorkspace,
  canLeaveWorkspace,
  canRevokeInvite,
  type WorkspaceRole,
} from "@sidekiq/workspace/lib/permissions";
import { sendWorkspaceInviteEmail } from "@sidekiq/workspace/api/emails";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@sidekiq/shared/trpc/trpc";
import {
  workspaces,
  workspaceMembers,
  workspaceInvites,
  user,
} from "@sidekiq/shared/db/schema";
import { type db as DbType } from "@sidekiq/shared/db";

const INVITE_TOKEN_LENGTH = 32;
const INVITE_EXPIRY_DAYS = 7;
const MAX_PENDING_INVITES_PER_WORKSPACE = 20;

/**
 * Helper to get user's role in a workspace.
 * Returns null if user is not a member.
 *
 * @param db - Database instance
 * @param workspaceId - Workspace ID to check
 * @param userId - User ID to check
 * @returns The user's role or null if not a member
 */
async function getUserWorkspaceRole(
  db: typeof DbType,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole | null> {
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId),
    ),
    columns: { role: true },
  });
  return membership?.role ?? null;
}

/**
 * Workspace router - CRUD operations for workspaces and member management.
 *
 * All mutations are protected (require authentication) and include
 * role-based permission checks using workspace permissions helpers.
 */
export const workspaceRouter = createTRPCRouter({
  /**
   * List all workspaces the user is a member of.
   * Includes owned workspaces and workspaces they've joined.
   *
   * @returns Array of workspaces with user's role and join date
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.userId, ctx.session.user.id),
      with: {
        workspace: true,
      },
      orderBy: [desc(workspaceMembers.joinedAt)],
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }),

  /**
   * Get a workspace by ID with member count.
   * User must be a member of the workspace.
   *
   * @param id - Workspace ID to retrieve
   * @returns Workspace object with memberCount and userRole
   * @throws NOT_FOUND if workspace doesn't exist or user is not a member
   */
  getById: protectedProcedure
    .input(getWorkspaceByIdSchema)
    .query(async ({ ctx, input }) => {
      const role = await getUserWorkspaceRole(
        ctx.db,
        input.id,
        ctx.session.user.id,
      );
      if (!role) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        });
      }

      const workspace = await ctx.db.query.workspaces.findFirst({
        where: eq(workspaces.id, input.id),
      });

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        });
      }

      // Get member count
      const memberCount = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, input.id));

      return {
        ...workspace,
        memberCount: memberCount[0]?.count ?? 0,
        userRole: role,
      };
    }),

  /**
   * Create a new workspace.
   * Creator becomes the owner and first member.
   *
   * @param input - Workspace data (name, avatar)
   * @returns Created workspace object
   */
  create: protectedProcedure
    .input(createWorkspaceSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = nanoid();

      const [workspace] = await ctx.db
        .insert(workspaces)
        .values({
          id: workspaceId,
          name: input.name,
          type: "team",
          ownerId: ctx.session.user.id,
          avatar: input.avatar,
        })
        .returning();

      // Add creator as owner member
      await ctx.db.insert(workspaceMembers).values({
        workspaceId,
        userId: ctx.session.user.id,
        role: "owner",
      });

      return workspace;
    }),

  /**
   * Update workspace name and/or avatar.
   * Requires owner or admin role.
   *
   * @param input - Workspace ID and fields to update
   * @returns Updated workspace object
   * @throws FORBIDDEN if user lacks permission
   * @throws NOT_FOUND if workspace doesn't exist
   */
  update: protectedProcedure
    .input(updateWorkspaceSchema)
    .mutation(async ({ ctx, input }) => {
      const role = await getUserWorkspaceRole(
        ctx.db,
        input.id,
        ctx.session.user.id,
      );
      if (!role || (role !== "owner" && role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can update workspace settings",
        });
      }

      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(workspaces)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(workspaces.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        });
      }

      return updated;
    }),

  /**
   * Delete a workspace.
   * Only the owner can delete.
   *
   * @param input - Workspace ID
   * @returns Success confirmation with deleted ID
   * @throws FORBIDDEN if user is not the owner
   */
  delete: protectedProcedure
    .input(deleteWorkspaceSchema)
    .mutation(async ({ ctx, input }) => {
      const role = await getUserWorkspaceRole(
        ctx.db,
        input.id,
        ctx.session.user.id,
      );
      if (!role || !canDeleteWorkspace(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the workspace owner can delete the workspace",
        });
      }

      const [deleted] = await ctx.db
        .delete(workspaces)
        .where(eq(workspaces.id, input.id))
        .returning({ id: workspaces.id });

      return { success: true, deletedId: deleted?.id };
    }),

  /**
   * List workspace members with their roles.
   * User must be a member of the workspace.
   *
   * @param id - Workspace ID
   * @returns Array of members with user details, sorted by role hierarchy
   * @throws NOT_FOUND if workspace doesn't exist or user is not a member
   */
  listMembers: protectedProcedure
    .input(getWorkspaceByIdSchema)
    .query(async ({ ctx, input }) => {
      const role = await getUserWorkspaceRole(
        ctx.db,
        input.id,
        ctx.session.user.id,
      );
      if (!role) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        });
      }

      const members = await ctx.db.query.workspaceMembers.findMany({
        where: eq(workspaceMembers.workspaceId, input.id),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: [
          // Owner first, then admin, then member
          sql`CASE ${workspaceMembers.role} WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END`,
          desc(workspaceMembers.joinedAt),
        ],
      });

      return members.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      }));
    }),

  /**
   * List pending invites for a workspace.
   * Requires owner or admin role.
   *
   * @param id - Workspace ID
   * @returns Array of pending invites
   * @throws FORBIDDEN if user lacks permission
   */
  listInvites: protectedProcedure
    .input(getWorkspaceByIdSchema)
    .query(async ({ ctx, input }) => {
      const role = await getUserWorkspaceRole(
        ctx.db,
        input.id,
        ctx.session.user.id,
      );
      if (!role || !canInvite(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view invites",
        });
      }

      const invites = await ctx.db.query.workspaceInvites.findMany({
        where: and(
          eq(workspaceInvites.workspaceId, input.id),
          isNull(workspaceInvites.acceptedAt),
          isNull(workspaceInvites.rejectedAt),
          gt(workspaceInvites.expiresAt, new Date()),
        ),
        orderBy: [desc(workspaceInvites.createdAt)],
      });

      return invites.map((i) => ({
        id: i.id,
        email: i.email,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      }));
    }),

  /**
   * Invite a member to the workspace.
   * Returns the invite URL for manual sharing.
   *
   * @param input - workspaceId, email, and sendEmail flag
   * @returns Invite details including URL
   * @throws FORBIDDEN if user lacks permission
   * @throws CONFLICT if user already a member or invite pending
   * @throws PRECONDITION_FAILED if member limit or invite limit reached
   */
  invite: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const role = await getUserWorkspaceRole(
        ctx.db,
        input.workspaceId,
        ctx.session.user.id,
      );
      if (!role || !canInvite(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to invite members",
        });
      }

      // Check workspace exists and get details
      const workspace = await ctx.db.query.workspaces.findFirst({
        where: eq(workspaces.id, input.workspaceId),
      });

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        });
      }

      // Check member limit
      const memberCount = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, input.workspaceId));

      if ((memberCount[0]?.count ?? 0) >= workspace.memberLimit) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Workspace has reached the member limit of ${workspace.memberLimit}`,
        });
      }

      // Check if already a member (case-insensitive email)
      const existingMember = await ctx.db
        .select({ userId: user.id })
        .from(user)
        .innerJoin(workspaceMembers, eq(workspaceMembers.userId, user.id))
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            sql`LOWER(${user.email}) = ${input.email.toLowerCase()}`,
          ),
        );

      if (existingMember.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This user is already a member of the workspace",
        });
      }

      // Check pending invite count
      const pendingInvites = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(workspaceInvites)
        .where(
          and(
            eq(workspaceInvites.workspaceId, input.workspaceId),
            isNull(workspaceInvites.acceptedAt),
            isNull(workspaceInvites.rejectedAt),
            gt(workspaceInvites.expiresAt, new Date()),
          ),
        );

      if (
        (pendingInvites[0]?.count ?? 0) >= MAX_PENDING_INVITES_PER_WORKSPACE
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Too many pending invites. Please revoke some before inviting more.",
        });
      }

      // Check if there's already a pending invite for this email
      const existingInvite = await ctx.db.query.workspaceInvites.findFirst({
        where: and(
          eq(workspaceInvites.workspaceId, input.workspaceId),
          sql`LOWER(${workspaceInvites.email}) = ${input.email.toLowerCase()}`,
          isNull(workspaceInvites.acceptedAt),
          isNull(workspaceInvites.rejectedAt),
          gt(workspaceInvites.expiresAt, new Date()),
        ),
      });

      if (existingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An invite for this email is already pending",
        });
      }

      // Create invite
      const token = nanoid(INVITE_TOKEN_LENGTH);
      const expiresAt = addDays(new Date(), INVITE_EXPIRY_DAYS);

      const [invite] = await ctx.db
        .insert(workspaceInvites)
        .values({
          id: nanoid(),
          workspaceId: input.workspaceId,
          email: input.email.toLowerCase(),
          token,
          expiresAt,
        })
        .returning();

      // Send email if requested
      let inviteUrl: string;
      if (input.sendEmail) {
        inviteUrl = await sendWorkspaceInviteEmail({
          to: input.email,
          workspaceName: workspace.name,
          inviterName: ctx.session.user.name,
          inviteToken: token,
        });
      } else {
        // Generate URL without sending email
        const { env } = await import("@sidekiq/shared/env");
        inviteUrl = `${env.BETTER_AUTH_URL}/invite/${token}`;
      }

      // invite is guaranteed to exist since insert().returning() succeeded
      const createdInvite = invite!;

      return {
        id: createdInvite.id,
        email: createdInvite.email,
        expiresAt: createdInvite.expiresAt,
        inviteUrl,
      };
    }),

  /**
   * Accept a workspace invite.
   * User must be authenticated with matching email.
   *
   * @param token - Invite token
   * @returns The workspace that was joined
   * @throws NOT_FOUND if invite invalid or expired
   * @throws FORBIDDEN if email doesn't match
   * @throws CONFLICT if already a member
   */
  acceptInvite: protectedProcedure
    .input(acceptInviteSchema)
    .mutation(async ({ ctx, input }) => {
      // Use transaction to prevent race condition
      return await ctx.db.transaction(async (tx) => {
        const invite = await tx.query.workspaceInvites.findFirst({
          where: and(
            eq(workspaceInvites.token, input.token),
            isNull(workspaceInvites.acceptedAt),
            isNull(workspaceInvites.rejectedAt),
            gt(workspaceInvites.expiresAt, new Date()),
          ),
          with: { workspace: true },
        });

        if (!invite) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invalid or expired invite",
          });
        }

        // Verify email matches (case-insensitive)
        if (
          invite.email.toLowerCase() !== ctx.session.user.email.toLowerCase()
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This invite was sent to a different email address",
          });
        }

        // Check if already a member
        const existingMember = await tx.query.workspaceMembers.findFirst({
          where: and(
            eq(workspaceMembers.workspaceId, invite.workspaceId),
            eq(workspaceMembers.userId, ctx.session.user.id),
          ),
        });

        if (existingMember) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You are already a member of this workspace",
          });
        }

        // Mark invite as accepted
        await tx
          .update(workspaceInvites)
          .set({ acceptedAt: new Date() })
          .where(eq(workspaceInvites.id, invite.id));

        // Add member
        await tx.insert(workspaceMembers).values({
          workspaceId: invite.workspaceId,
          userId: ctx.session.user.id,
          role: "member",
        });

        return { workspace: invite.workspace };
      });
    }),

  /**
   * Get invite details by token (public, for invite acceptance page).
   *
   * @param token - Invite token
   * @returns Invite details or null if not found
   */
  getInviteByToken: publicProcedure
    .input(acceptInviteSchema)
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db.query.workspaceInvites.findFirst({
        where: and(
          eq(workspaceInvites.token, input.token),
          isNull(workspaceInvites.acceptedAt),
          isNull(workspaceInvites.rejectedAt),
        ),
        with: { workspace: true },
      });

      if (!invite) {
        return null;
      }

      const isExpired = invite.expiresAt < new Date();

      return {
        workspaceName: invite.workspace.name,
        workspaceAvatar: invite.workspace.avatar,
        email: invite.email,
        isExpired,
        expiresAt: invite.expiresAt,
      };
    }),

  /**
   * Revoke a pending invite.
   *
   * @param inviteId - ID of the invite to revoke
   * @returns Success confirmation
   * @throws NOT_FOUND if invite doesn't exist
   * @throws FORBIDDEN if user lacks permission
   */
  revokeInvite: protectedProcedure
    .input(revokeInviteSchema)
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.query.workspaceInvites.findFirst({
        where: eq(workspaceInvites.id, input.inviteId),
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }

      const role = await getUserWorkspaceRole(
        ctx.db,
        invite.workspaceId,
        ctx.session.user.id,
      );
      if (!role || !canRevokeInvite(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to revoke invites",
        });
      }

      await ctx.db
        .delete(workspaceInvites)
        .where(eq(workspaceInvites.id, input.inviteId));

      return { success: true };
    }),

  /**
   * Resend an invite (regenerates token, sends new email).
   *
   * @param inviteId - ID of the invite to resend
   * @returns New invite URL
   * @throws NOT_FOUND if invite doesn't exist or already used
   * @throws FORBIDDEN if user lacks permission
   */
  resendInvite: protectedProcedure
    .input(resendInviteSchema)
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.query.workspaceInvites.findFirst({
        where: and(
          eq(workspaceInvites.id, input.inviteId),
          isNull(workspaceInvites.acceptedAt),
          isNull(workspaceInvites.rejectedAt),
        ),
        with: { workspace: true },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found or already used",
        });
      }

      const role = await getUserWorkspaceRole(
        ctx.db,
        invite.workspaceId,
        ctx.session.user.id,
      );
      if (!role || !canInvite(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to resend invites",
        });
      }

      // Generate new token and expiry
      const newToken = nanoid(INVITE_TOKEN_LENGTH);
      const newExpiresAt = addDays(new Date(), INVITE_EXPIRY_DAYS);

      await ctx.db
        .update(workspaceInvites)
        .set({ token: newToken, expiresAt: newExpiresAt })
        .where(eq(workspaceInvites.id, input.inviteId));

      // Send email
      const inviteUrl = await sendWorkspaceInviteEmail({
        to: invite.email,
        workspaceName: invite.workspace.name,
        inviterName: ctx.session.user.name,
        inviteToken: newToken,
      });

      return { inviteUrl };
    }),

  /**
   * Remove a member from the workspace.
   *
   * @param input - workspaceId and userId of member to remove
   * @returns Success confirmation
   * @throws NOT_FOUND if member doesn't exist
   * @throws FORBIDDEN if user lacks permission
   */
  removeMember: protectedProcedure
    .input(removeMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const actorRole = await getUserWorkspaceRole(
        ctx.db,
        input.workspaceId,
        ctx.session.user.id,
      );
      const targetMember = await ctx.db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, input.workspaceId),
          eq(workspaceMembers.userId, input.userId),
        ),
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      const isSelf = input.userId === ctx.session.user.id;
      if (
        !actorRole ||
        !canRemoveMember(actorRole, targetMember.role, isSelf)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to remove this member",
        });
      }

      await ctx.db
        .delete(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, input.userId),
          ),
        );

      return { success: true };
    }),

  /**
   * Change a member's role.
   *
   * @param input - workspaceId, userId, and newRole
   * @returns Updated member details
   * @throws NOT_FOUND if member doesn't exist
   * @throws FORBIDDEN if role change not allowed
   */
  changeRole: protectedProcedure
    .input(changeRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const actorRole = await getUserWorkspaceRole(
        ctx.db,
        input.workspaceId,
        ctx.session.user.id,
      );
      const targetMember = await ctx.db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, input.workspaceId),
          eq(workspaceMembers.userId, input.userId),
        ),
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (
        !actorRole ||
        !canChangeRole(actorRole, targetMember.role, input.newRole)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to change this member's role",
        });
      }

      const [updated] = await ctx.db
        .update(workspaceMembers)
        .set({ role: input.newRole })
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, input.userId),
          ),
        )
        .returning();

      // updated is guaranteed to exist since we verified the member exists above
      const updatedMember = updated!;

      return { userId: updatedMember.userId, role: updatedMember.role };
    }),

  /**
   * Transfer workspace ownership to another member.
   *
   * @param input - workspaceId and newOwnerId
   * @returns Success confirmation
   * @throws FORBIDDEN if not the owner
   * @throws NOT_FOUND if new owner is not a member
   */
  transferOwnership: protectedProcedure
    .input(transferOwnershipSchema)
    .mutation(async ({ ctx, input }) => {
      const actorRole = await getUserWorkspaceRole(
        ctx.db,
        input.workspaceId,
        ctx.session.user.id,
      );
      if (!actorRole || !canTransferOwnership(actorRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can transfer ownership",
        });
      }

      // Verify new owner is a member
      const newOwnerMember = await ctx.db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, input.workspaceId),
          eq(workspaceMembers.userId, input.newOwnerId),
        ),
      });

      if (!newOwnerMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not a member of this workspace",
        });
      }

      // Use transaction for atomic ownership transfer
      await ctx.db.transaction(async (tx) => {
        // Update workspace ownerId
        await tx
          .update(workspaces)
          .set({ ownerId: input.newOwnerId, updatedAt: new Date() })
          .where(eq(workspaces.id, input.workspaceId));

        // Change old owner to admin
        await tx
          .update(workspaceMembers)
          .set({ role: "admin" })
          .where(
            and(
              eq(workspaceMembers.workspaceId, input.workspaceId),
              eq(workspaceMembers.userId, ctx.session.user.id),
            ),
          );

        // Change new owner to owner
        await tx
          .update(workspaceMembers)
          .set({ role: "owner" })
          .where(
            and(
              eq(workspaceMembers.workspaceId, input.workspaceId),
              eq(workspaceMembers.userId, input.newOwnerId),
            ),
          );
      });

      return { success: true };
    }),

  /**
   * Leave a workspace (self-leave for non-owners).
   *
   * @param workspaceId - Workspace to leave
   * @returns Success confirmation
   * @throws NOT_FOUND if not a member
   * @throws FORBIDDEN if user is the owner
   */
  leave: protectedProcedure
    .input(leaveWorkspaceSchema)
    .mutation(async ({ ctx, input }) => {
      const role = await getUserWorkspaceRole(
        ctx.db,
        input.workspaceId,
        ctx.session.user.id,
      );
      if (!role) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not a member of this workspace",
        });
      }

      if (!canLeaveWorkspace(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Owner cannot leave the workspace. Transfer ownership first.",
        });
      }

      await ctx.db
        .delete(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),
});
