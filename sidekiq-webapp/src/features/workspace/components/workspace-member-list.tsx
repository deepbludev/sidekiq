"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";

import { Input } from "@sidekiq/ui/input";
import { Button } from "@sidekiq/ui/button";
import { WorkspaceMemberRow } from "@sidekiq/workspace/components/workspace-member-row";
import { RemoveMemberDialog } from "@sidekiq/workspace/components/remove-member-dialog";
import { InviteMemberDialog } from "@sidekiq/workspace/components/invite-member-dialog";
import {
  useMemberSearch,
  type WorkspaceMember,
} from "@sidekiq/workspace/hooks/use-member-search";
import {
  canInvite,
  type WorkspaceRole,
} from "@sidekiq/workspace/lib/permissions";
import { api } from "@sidekiq/shared/trpc/react";

interface WorkspaceMemberListProps {
  /** Workspace ID for API calls */
  workspaceId: string;
  /** Workspace name for invite dialog display */
  workspaceName: string;
  /** List of workspace members */
  members: WorkspaceMember[];
  /** Maximum member limit for workspace */
  memberLimit: number;
  /** Current user's role in the workspace */
  currentUserRole: WorkspaceRole;
  /** Current user's ID */
  currentUserId: string;
  /** Callback after member is removed */
  onMemberRemoved?: () => void;
  /** Callback after role is changed */
  onRoleChanged?: () => void;
  /** Callback after user leaves workspace */
  onLeft?: () => void;
}

/**
 * Workspace member list with search, invite button, and member rows.
 * Displays member count as "X/Y members" per CONTEXT.md.
 *
 * @param props - Component props
 */
export function WorkspaceMemberList({
  workspaceId,
  workspaceName,
  members,
  memberLimit,
  currentUserRole,
  currentUserId,
  onMemberRemoved,
  onRoleChanged,
  onLeft,
}: WorkspaceMemberListProps) {
  const { query, setQuery, results, highlightMatch } = useMemberSearch(members);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(
    null,
  );

  const utils = api.useUtils();

  const inviteMutation = api.workspace.invite.useMutation({
    onSuccess: () => {
      void utils.workspace.listInvites.invalidate({ id: workspaceId });
    },
  });

  const removeMutation = api.workspace.removeMember.useMutation({
    onSuccess: () => {
      void utils.workspace.listMembers.invalidate({ id: workspaceId });
      void utils.workspace.getById.invalidate({ id: workspaceId });
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
      onMemberRemoved?.();
    },
  });

  const changeRoleMutation = api.workspace.changeRole.useMutation({
    onSuccess: () => {
      void utils.workspace.listMembers.invalidate({ id: workspaceId });
      onRoleChanged?.();
    },
  });

  const leaveMutation = api.workspace.leave.useMutation({
    onSuccess: () => {
      void utils.workspace.list.invalidate();
      onLeft?.();
    },
  });

  /**
   * Handle invite creation.
   * @param email - Email to invite
   * @param sendEmail - Whether to send email notification
   * @returns Invite result with URL
   */
  const handleInvite = async (email: string, sendEmail: boolean) => {
    return inviteMutation.mutateAsync({
      workspaceId,
      email,
      sendEmail,
    });
  };

  /**
   * Handle remove button click - opens confirmation dialog.
   * @param userId - User ID to remove
   */
  const handleRemoveClick = (userId: string) => {
    const member = members.find((m) => m.userId === userId);
    if (member) {
      setMemberToRemove(member);
      setRemoveDialogOpen(true);
    }
  };

  /**
   * Handle remove confirmation.
   */
  const handleRemoveConfirm = () => {
    if (memberToRemove) {
      removeMutation.mutate({
        workspaceId,
        userId: memberToRemove.userId,
      });
    }
  };

  /**
   * Handle role change action.
   * @param userId - User ID to change role for
   * @param newRole - New role to assign
   */
  const handleChangeRole = (userId: string, newRole: "admin" | "member") => {
    changeRoleMutation.mutate({ workspaceId, userId, newRole });
  };

  /**
   * Handle self-leave action.
   */
  const handleLeave = () => {
    leaveMutation.mutate({ workspaceId });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">
            {members.length}/{memberLimit} members
          </span>

          {canInvite(currentUserRole) && (
            <Button onClick={() => setInviteDialogOpen(true)} size="sm">
              <UserPlus className="mr-2 size-4" />
              Invite
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {results.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            {query ? "No members match your search" : "No members yet"}
          </div>
        ) : (
          results.map((member) => (
            <WorkspaceMemberRow
              key={member.userId}
              member={member}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
              onRemove={handleRemoveClick}
              onChangeRole={handleChangeRole}
              onLeave={handleLeave}
              highlightMatch={highlightMatch}
            />
          ))
        )}
      </div>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={handleInvite}
        workspaceName={workspaceName}
        isInviting={inviteMutation.isPending}
      />

      <RemoveMemberDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        onConfirm={handleRemoveConfirm}
        memberName={memberToRemove?.user.name ?? ""}
        isRemoving={removeMutation.isPending}
      />
    </div>
  );
}
