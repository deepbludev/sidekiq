/**
 * Team role type from database enum.
 */
export type TeamRole = "owner" | "admin" | "member";

/**
 * Check if a user with the given role can invite new members.
 * Per CONTEXT.md: Owners and Admins can invite.
 *
 * @param userRole - The role of the user attempting to invite (null = not a member)
 * @returns true if the user can invite members
 */
export function canInvite(userRole: TeamRole | null): boolean {
  return userRole === "owner" || userRole === "admin";
}

/**
 * Check if a user can remove a specific member.
 * Per CONTEXT.md:
 * - Owner can remove anyone except themselves
 * - Admin can remove members only (not other admins)
 * - Members cannot remove anyone
 *
 * @param userRole - The role of the user attempting to remove (null = not a member)
 * @param targetRole - The role of the member being removed
 * @param isSelf - Whether the user is trying to remove themselves
 * @returns true if removal is allowed
 */
export function canRemoveMember(
  userRole: TeamRole | null,
  targetRole: TeamRole,
  isSelf: boolean,
): boolean {
  if (!userRole) return false;
  // Cannot remove self (owner must transfer, others must leave)
  if (isSelf) return false;

  if (userRole === "owner") {
    // Owner can remove anyone except another owner (there's only one owner)
    return targetRole !== "owner";
  }
  if (userRole === "admin") {
    // Admin can only remove members, not other admins
    return targetRole === "member";
  }
  return false;
}

/**
 * Check if a user can change another member's role.
 * Per CONTEXT.md:
 * - Owner can change any role
 * - Admin can promote member to admin, demote admin to member
 * - Admin cannot promote to owner
 * - Members cannot change roles
 *
 * @param userRole - The role of the user attempting to change roles (null = not a member)
 * @param targetRole - The current role of the member being changed
 * @param newRole - The role to change to
 * @returns true if the role change is allowed
 */
export function canChangeRole(
  userRole: TeamRole | null,
  targetRole: TeamRole,
  newRole: TeamRole,
): boolean {
  if (!userRole) return false;
  // Cannot change own role via this check (use transfer for owner)
  if (userRole === "owner") {
    // Owner can change any role except their own
    return targetRole !== "owner";
  }
  if (userRole === "admin") {
    // Admin can change member <-> admin but not to owner
    if (newRole === "owner") return false;
    return targetRole === "member" || targetRole === "admin";
  }
  return false;
}

/**
 * Check if a user can transfer team ownership.
 * Only the owner can transfer ownership.
 *
 * @param userRole - The role of the user attempting to transfer ownership (null = not a member)
 * @returns true if the user can transfer ownership
 */
export function canTransferOwnership(userRole: TeamRole | null): boolean {
  return userRole === "owner";
}

/**
 * Check if a user can delete the team.
 * Only the owner can delete the team.
 *
 * @param userRole - The role of the user attempting to delete (null = not a member)
 * @returns true if the user can delete the team
 */
export function canDeleteTeam(userRole: TeamRole | null): boolean {
  return userRole === "owner";
}

/**
 * Check if a user can leave the team.
 * Per CONTEXT.md: Members can self-leave.
 * Owner cannot leave (must transfer ownership first).
 *
 * @param userRole - The role of the user attempting to leave
 * @returns true if the user can leave the team
 */
export function canLeaveTeam(userRole: TeamRole): boolean {
  return userRole !== "owner";
}

/**
 * Check if a user can revoke a pending invite.
 * Owners and Admins can revoke invites.
 *
 * @param userRole - The role of the user attempting to revoke (null = not a member)
 * @returns true if the user can revoke invites
 */
export function canRevokeInvite(userRole: TeamRole | null): boolean {
  return userRole === "owner" || userRole === "admin";
}

/**
 * Check if a user can update team settings (name, avatar).
 * Only Owners and Admins can update team settings.
 *
 * @param userRole - The role of the user attempting to update (null = not a member)
 * @returns true if the user can update team settings
 */
export function canUpdateTeam(userRole: TeamRole | null): boolean {
  return userRole === "owner" || userRole === "admin";
}

/**
 * Get display icon for a role.
 * Per CONTEXT.md: crown for owner, shield for admin.
 *
 * @param role - The team role
 * @returns Icon identifier or null for members
 */
export function getRoleIcon(role: TeamRole): "crown" | "shield" | null {
  if (role === "owner") return "crown";
  if (role === "admin") return "shield";
  return null;
}

/**
 * Get display label for a role.
 *
 * @param role - The team role
 * @returns Human-readable role label
 */
export function getRoleLabel(role: TeamRole): string {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}
