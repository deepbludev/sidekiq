import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import type { db as dbInstance } from "@sidekiq/shared/db";
import { workspaceMembers, workspaces } from "@sidekiq/shared/db/schema";
import type { WorkspaceRole } from "@sidekiq/workspace/lib/permissions";

/**
 * Result of a workspace membership validation.
 */
interface WorkspaceMembership {
  role: WorkspaceRole;
  workspaceType: "personal" | "team";
}

/**
 * Result of resolving a workspace ID from a request header.
 */
interface ResolvedWorkspace {
  workspaceId: string;
  role: WorkspaceRole;
}

/**
 * Validate that a user is a member of a workspace.
 *
 * Returns membership details (role, workspace type) or null if the user
 * is not a member of the specified workspace.
 *
 * Shared between tRPC `workspaceProcedure` middleware and the `/api/chat`
 * route handler so that workspace membership validation is consistent
 * across all server-side code paths.
 *
 * @param db - Database instance
 * @param workspaceId - Workspace ID to validate membership for
 * @param userId - User ID to check
 * @returns Membership details or null if user is not a member
 */
export async function validateWorkspaceMembership(
  db: typeof dbInstance,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMembership | null> {
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId),
    ),
    columns: { role: true },
    with: {
      workspace: {
        columns: { type: true },
      },
    },
  });

  if (!membership) return null;

  return {
    role: membership.role,
    workspaceType: membership.workspace.type,
  };
}

/**
 * Resolve the active workspace ID from a request header value.
 *
 * Resolution order:
 * 1. If `headerWorkspaceId` is provided and the user is a member, return it.
 * 2. If `headerWorkspaceId` is provided but the user is NOT a member, log a
 *    security warning and fall through to personal workspace.
 * 3. If no header is provided (or after fallthrough), look up the user's
 *    personal workspace.
 * 4. If the personal workspace is missing (race condition during signup),
 *    auto-create it (self-healing).
 *
 * This function never throws -- it always resolves to a valid workspace.
 *
 * Shared between tRPC `workspaceProcedure` middleware and the `/api/chat`
 * route handler so that workspace resolution is consistent across all
 * server-side code paths.
 *
 * @param db - Database instance
 * @param headerWorkspaceId - Value from the `x-workspace-id` request header (may be null)
 * @param userId - Authenticated user's ID
 * @returns Resolved workspace ID and the user's role in that workspace
 */
export async function resolveWorkspaceId(
  db: typeof dbInstance,
  headerWorkspaceId: string | null,
  userId: string,
): Promise<ResolvedWorkspace> {
  // 1. If header provided, validate membership
  if (headerWorkspaceId) {
    const membership = await validateWorkspaceMembership(
      db,
      headerWorkspaceId,
      userId,
    );
    if (membership) {
      return { workspaceId: headerWorkspaceId, role: membership.role };
    }

    // 2. Header workspace invalid -- log security warning and fall through
    console.warn(
      `[Auth] Unauthorized workspace access: userId=${userId}, workspaceId=${headerWorkspaceId}, timestamp=${new Date().toISOString()}`,
    );
  }

  // 3. Fall back to personal workspace
  const personalWorkspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.ownerId, userId), eq(workspaces.type, "personal")),
    columns: { id: true },
  });

  if (personalWorkspace) {
    return {
      workspaceId: personalWorkspace.id,
      role: "owner" as WorkspaceRole,
    };
  }

  // 4. Self-healing: auto-create personal workspace if missing
  //    Mirrors databaseHooks.user.create.after in features/auth/api/config.ts
  const workspaceId = nanoid();

  await db.insert(workspaces).values({
    id: workspaceId,
    name: "Personal",
    type: "personal",
    ownerId: userId,
    memberLimit: 1,
    avatar: { type: "initials" as const, color: "#6366f1" },
  });

  await db.insert(workspaceMembers).values({
    workspaceId,
    userId,
    role: "owner",
  });

  console.log(
    `[Auth] Self-healed personal workspace for user ${userId}: ${workspaceId}`,
  );

  return { workspaceId, role: "owner" as WorkspaceRole };
}
