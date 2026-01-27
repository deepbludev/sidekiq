import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { addDays } from "date-fns";

import {
  createTeamSchema,
  updateTeamSchema,
  deleteTeamSchema,
  getTeamByIdSchema,
  inviteMemberSchema,
  acceptInviteSchema,
  revokeInviteSchema,
  resendInviteSchema,
  removeMemberSchema,
  changeRoleSchema,
  transferOwnershipSchema,
  leaveTeamSchema,
} from "@sidekiq/workspace/validations";
import {
  canInvite,
  canRemoveMember,
  canChangeRole,
  canTransferOwnership,
  canDeleteTeam,
  canLeaveTeam,
  canRevokeInvite,
  type TeamRole,
} from "@sidekiq/workspace/lib/permissions";
import { sendTeamInviteEmail } from "@sidekiq/workspace/api/emails";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@sidekiq/shared/trpc/trpc";
import {
  teams,
  teamMembers,
  teamInvites,
  user,
} from "@sidekiq/shared/db/schema";
import { type db as DbType } from "@sidekiq/shared/db";

const INVITE_TOKEN_LENGTH = 32;
const INVITE_EXPIRY_DAYS = 7;
const MAX_PENDING_INVITES_PER_TEAM = 20;

/**
 * Helper to get user's role in a team.
 * Returns null if user is not a member.
 *
 * @param db - Database instance
 * @param teamId - Team ID to check
 * @param userId - User ID to check
 * @returns The user's role or null if not a member
 */
async function getUserTeamRole(
  db: typeof DbType,
  teamId: string,
  userId: string,
): Promise<TeamRole | null> {
  const membership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
    columns: { role: true },
  });
  return membership?.role ?? null;
}

/**
 * Team router - CRUD operations for teams and member management.
 *
 * All mutations are protected (require authentication) and include
 * role-based permission checks using team-permissions.ts helpers.
 */
export const teamRouter = createTRPCRouter({
  /**
   * List all teams the user is a member of.
   * Includes owned teams and teams they've joined.
   *
   * @returns Array of teams with user's role and join date
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, ctx.session.user.id),
      with: {
        team: true,
      },
      orderBy: [desc(teamMembers.joinedAt)],
    });

    return memberships.map((m) => ({
      ...m.team,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }),

  /**
   * Get a team by ID with member count.
   * User must be a member of the team.
   *
   * @param id - Team ID to retrieve
   * @returns Team object with memberCount and userRole
   * @throws NOT_FOUND if team doesn't exist or user is not a member
   */
  getById: protectedProcedure
    .input(getTeamByIdSchema)
    .query(async ({ ctx, input }) => {
      const role = await getUserTeamRole(ctx.db, input.id, ctx.session.user.id);
      if (!role) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.id),
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      // Get member count
      const memberCount = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, input.id));

      return {
        ...team,
        memberCount: memberCount[0]?.count ?? 0,
        userRole: role,
      };
    }),

  /**
   * Create a new team.
   * Creator becomes the owner and first member.
   *
   * @param input - Team data (name, avatar)
   * @returns Created team object
   */
  create: protectedProcedure
    .input(createTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const teamId = nanoid();

      const [team] = await ctx.db
        .insert(teams)
        .values({
          id: teamId,
          name: input.name,
          ownerId: ctx.session.user.id,
          avatar: input.avatar,
        })
        .returning();

      // Add creator as owner member
      await ctx.db.insert(teamMembers).values({
        teamId,
        userId: ctx.session.user.id,
        role: "owner",
      });

      return team;
    }),

  /**
   * Update team name and/or avatar.
   * Requires owner or admin role.
   *
   * @param input - Team ID and fields to update
   * @returns Updated team object
   * @throws FORBIDDEN if user lacks permission
   * @throws NOT_FOUND if team doesn't exist
   */
  update: protectedProcedure
    .input(updateTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const role = await getUserTeamRole(ctx.db, input.id, ctx.session.user.id);
      if (!role || (role !== "owner" && role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can update team settings",
        });
      }

      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(teams)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(teams.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      return updated;
    }),

  /**
   * Delete a team.
   * Only the owner can delete.
   *
   * @param input - Team ID
   * @returns Success confirmation with deleted ID
   * @throws FORBIDDEN if user is not the owner
   */
  delete: protectedProcedure
    .input(deleteTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const role = await getUserTeamRole(ctx.db, input.id, ctx.session.user.id);
      if (!role || !canDeleteTeam(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the team owner can delete the team",
        });
      }

      const [deleted] = await ctx.db
        .delete(teams)
        .where(eq(teams.id, input.id))
        .returning({ id: teams.id });

      return { success: true, deletedId: deleted?.id };
    }),

  /**
   * List team members with their roles.
   * User must be a member of the team.
   *
   * @param id - Team ID
   * @returns Array of members with user details, sorted by role hierarchy
   * @throws NOT_FOUND if team doesn't exist or user is not a member
   */
  listMembers: protectedProcedure
    .input(getTeamByIdSchema)
    .query(async ({ ctx, input }) => {
      const role = await getUserTeamRole(ctx.db, input.id, ctx.session.user.id);
      if (!role) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const members = await ctx.db.query.teamMembers.findMany({
        where: eq(teamMembers.teamId, input.id),
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
          sql`CASE ${teamMembers.role} WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END`,
          desc(teamMembers.joinedAt),
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
   * List pending invites for a team.
   * Requires owner or admin role.
   *
   * @param id - Team ID
   * @returns Array of pending invites
   * @throws FORBIDDEN if user lacks permission
   */
  listInvites: protectedProcedure
    .input(getTeamByIdSchema)
    .query(async ({ ctx, input }) => {
      const role = await getUserTeamRole(ctx.db, input.id, ctx.session.user.id);
      if (!role || !canInvite(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view invites",
        });
      }

      const invites = await ctx.db.query.teamInvites.findMany({
        where: and(
          eq(teamInvites.teamId, input.id),
          isNull(teamInvites.acceptedAt),
          isNull(teamInvites.rejectedAt),
          gt(teamInvites.expiresAt, new Date()),
        ),
        orderBy: [desc(teamInvites.createdAt)],
      });

      return invites.map((i) => ({
        id: i.id,
        email: i.email,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      }));
    }),

  /**
   * Invite a member to the team.
   * Returns the invite URL for manual sharing.
   *
   * @param input - teamId, email, and sendEmail flag
   * @returns Invite details including URL
   * @throws FORBIDDEN if user lacks permission
   * @throws CONFLICT if user already a member or invite pending
   * @throws PRECONDITION_FAILED if member limit or invite limit reached
   */
  invite: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const role = await getUserTeamRole(
        ctx.db,
        input.teamId,
        ctx.session.user.id,
      );
      if (!role || !canInvite(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to invite members",
        });
      }

      // Check team exists and get details
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.teamId),
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      // Check member limit
      const memberCount = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, input.teamId));

      if ((memberCount[0]?.count ?? 0) >= team.memberLimit) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Team has reached the member limit of ${team.memberLimit}`,
        });
      }

      // Check if already a member (case-insensitive email)
      const existingMember = await ctx.db
        .select({ userId: user.id })
        .from(user)
        .innerJoin(teamMembers, eq(teamMembers.userId, user.id))
        .where(
          and(
            eq(teamMembers.teamId, input.teamId),
            sql`LOWER(${user.email}) = ${input.email.toLowerCase()}`,
          ),
        );

      if (existingMember.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This user is already a member of the team",
        });
      }

      // Check pending invite count
      const pendingInvites = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(teamInvites)
        .where(
          and(
            eq(teamInvites.teamId, input.teamId),
            isNull(teamInvites.acceptedAt),
            isNull(teamInvites.rejectedAt),
            gt(teamInvites.expiresAt, new Date()),
          ),
        );

      if ((pendingInvites[0]?.count ?? 0) >= MAX_PENDING_INVITES_PER_TEAM) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Too many pending invites. Please revoke some before inviting more.",
        });
      }

      // Check if there's already a pending invite for this email
      const existingInvite = await ctx.db.query.teamInvites.findFirst({
        where: and(
          eq(teamInvites.teamId, input.teamId),
          sql`LOWER(${teamInvites.email}) = ${input.email.toLowerCase()}`,
          isNull(teamInvites.acceptedAt),
          isNull(teamInvites.rejectedAt),
          gt(teamInvites.expiresAt, new Date()),
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
        .insert(teamInvites)
        .values({
          id: nanoid(),
          teamId: input.teamId,
          email: input.email.toLowerCase(),
          token,
          expiresAt,
        })
        .returning();

      // Send email if requested
      let inviteUrl: string;
      if (input.sendEmail) {
        inviteUrl = await sendTeamInviteEmail({
          to: input.email,
          teamName: team.name,
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
   * Accept a team invite.
   * User must be authenticated with matching email.
   *
   * @param token - Invite token
   * @returns The team that was joined
   * @throws NOT_FOUND if invite invalid or expired
   * @throws FORBIDDEN if email doesn't match
   * @throws CONFLICT if already a member
   */
  acceptInvite: protectedProcedure
    .input(acceptInviteSchema)
    .mutation(async ({ ctx, input }) => {
      // Use transaction to prevent race condition
      return await ctx.db.transaction(async (tx) => {
        const invite = await tx.query.teamInvites.findFirst({
          where: and(
            eq(teamInvites.token, input.token),
            isNull(teamInvites.acceptedAt),
            isNull(teamInvites.rejectedAt),
            gt(teamInvites.expiresAt, new Date()),
          ),
          with: { team: true },
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
        const existingMember = await tx.query.teamMembers.findFirst({
          where: and(
            eq(teamMembers.teamId, invite.teamId),
            eq(teamMembers.userId, ctx.session.user.id),
          ),
        });

        if (existingMember) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You are already a member of this team",
          });
        }

        // Mark invite as accepted
        await tx
          .update(teamInvites)
          .set({ acceptedAt: new Date() })
          .where(eq(teamInvites.id, invite.id));

        // Add member
        await tx.insert(teamMembers).values({
          teamId: invite.teamId,
          userId: ctx.session.user.id,
          role: "member",
        });

        return { team: invite.team };
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
      const invite = await ctx.db.query.teamInvites.findFirst({
        where: and(
          eq(teamInvites.token, input.token),
          isNull(teamInvites.acceptedAt),
          isNull(teamInvites.rejectedAt),
        ),
        with: { team: true },
      });

      if (!invite) {
        return null;
      }

      const isExpired = invite.expiresAt < new Date();

      return {
        teamName: invite.team.name,
        teamAvatar: invite.team.avatar,
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
      const invite = await ctx.db.query.teamInvites.findFirst({
        where: eq(teamInvites.id, input.inviteId),
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }

      const role = await getUserTeamRole(
        ctx.db,
        invite.teamId,
        ctx.session.user.id,
      );
      if (!role || !canRevokeInvite(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to revoke invites",
        });
      }

      await ctx.db
        .delete(teamInvites)
        .where(eq(teamInvites.id, input.inviteId));

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
      const invite = await ctx.db.query.teamInvites.findFirst({
        where: and(
          eq(teamInvites.id, input.inviteId),
          isNull(teamInvites.acceptedAt),
          isNull(teamInvites.rejectedAt),
        ),
        with: { team: true },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found or already used",
        });
      }

      const role = await getUserTeamRole(
        ctx.db,
        invite.teamId,
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
        .update(teamInvites)
        .set({ token: newToken, expiresAt: newExpiresAt })
        .where(eq(teamInvites.id, input.inviteId));

      // Send email
      const inviteUrl = await sendTeamInviteEmail({
        to: invite.email,
        teamName: invite.team.name,
        inviterName: ctx.session.user.name,
        inviteToken: newToken,
      });

      return { inviteUrl };
    }),

  /**
   * Remove a member from the team.
   *
   * @param input - teamId and userId of member to remove
   * @returns Success confirmation
   * @throws NOT_FOUND if member doesn't exist
   * @throws FORBIDDEN if user lacks permission
   */
  removeMember: protectedProcedure
    .input(removeMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const actorRole = await getUserTeamRole(
        ctx.db,
        input.teamId,
        ctx.session.user.id,
      );
      const targetMember = await ctx.db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, input.teamId),
          eq(teamMembers.userId, input.userId),
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
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, input.teamId),
            eq(teamMembers.userId, input.userId),
          ),
        );

      return { success: true };
    }),

  /**
   * Change a member's role.
   *
   * @param input - teamId, userId, and newRole
   * @returns Updated member details
   * @throws NOT_FOUND if member doesn't exist
   * @throws FORBIDDEN if role change not allowed
   */
  changeRole: protectedProcedure
    .input(changeRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const actorRole = await getUserTeamRole(
        ctx.db,
        input.teamId,
        ctx.session.user.id,
      );
      const targetMember = await ctx.db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, input.teamId),
          eq(teamMembers.userId, input.userId),
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
        .update(teamMembers)
        .set({ role: input.newRole })
        .where(
          and(
            eq(teamMembers.teamId, input.teamId),
            eq(teamMembers.userId, input.userId),
          ),
        )
        .returning();

      // updated is guaranteed to exist since we verified the member exists above
      const updatedMember = updated!;

      return { userId: updatedMember.userId, role: updatedMember.role };
    }),

  /**
   * Transfer team ownership to another member.
   *
   * @param input - teamId and newOwnerId
   * @returns Success confirmation
   * @throws FORBIDDEN if not the owner
   * @throws NOT_FOUND if new owner is not a member
   */
  transferOwnership: protectedProcedure
    .input(transferOwnershipSchema)
    .mutation(async ({ ctx, input }) => {
      const actorRole = await getUserTeamRole(
        ctx.db,
        input.teamId,
        ctx.session.user.id,
      );
      if (!actorRole || !canTransferOwnership(actorRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can transfer ownership",
        });
      }

      // Verify new owner is a member
      const newOwnerMember = await ctx.db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, input.teamId),
          eq(teamMembers.userId, input.newOwnerId),
        ),
      });

      if (!newOwnerMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not a member of this team",
        });
      }

      // Use transaction for atomic ownership transfer
      await ctx.db.transaction(async (tx) => {
        // Update team ownerId
        await tx
          .update(teams)
          .set({ ownerId: input.newOwnerId, updatedAt: new Date() })
          .where(eq(teams.id, input.teamId));

        // Change old owner to admin
        await tx
          .update(teamMembers)
          .set({ role: "admin" })
          .where(
            and(
              eq(teamMembers.teamId, input.teamId),
              eq(teamMembers.userId, ctx.session.user.id),
            ),
          );

        // Change new owner to owner
        await tx
          .update(teamMembers)
          .set({ role: "owner" })
          .where(
            and(
              eq(teamMembers.teamId, input.teamId),
              eq(teamMembers.userId, input.newOwnerId),
            ),
          );
      });

      return { success: true };
    }),

  /**
   * Leave a team (self-leave for non-owners).
   *
   * @param teamId - Team to leave
   * @returns Success confirmation
   * @throws NOT_FOUND if not a member
   * @throws FORBIDDEN if user is the owner
   */
  leave: protectedProcedure
    .input(leaveTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const role = await getUserTeamRole(
        ctx.db,
        input.teamId,
        ctx.session.user.id,
      );
      if (!role) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not a member of this team",
        });
      }

      if (!canLeaveTeam(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Owner cannot leave the team. Transfer ownership first.",
        });
      }

      await ctx.db
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, input.teamId),
            eq(teamMembers.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),
});
