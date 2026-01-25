"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";

import { Input } from "@sidekiq/components/ui/input";
import { Button } from "@sidekiq/components/ui/button";
import { TeamMemberRow } from "@sidekiq/components/team/team-member-row";
import { RemoveMemberDialog } from "@sidekiq/components/team/remove-member-dialog";
import { InviteMemberDialog } from "@sidekiq/components/team/invite-member-dialog";
import {
  useMemberSearch,
  type TeamMember,
} from "@sidekiq/hooks/use-member-search";
import { canInvite, type TeamRole } from "@sidekiq/lib/team-permissions";
import { api } from "@sidekiq/trpc/react";

interface TeamMemberListProps {
  /** Team ID for API calls */
  teamId: string;
  /** Team name for invite dialog display */
  teamName: string;
  /** List of team members */
  members: TeamMember[];
  /** Maximum member limit for team */
  memberLimit: number;
  /** Current user's role in the team */
  currentUserRole: TeamRole;
  /** Current user's ID */
  currentUserId: string;
  /** Callback after member is removed */
  onMemberRemoved?: () => void;
  /** Callback after role is changed */
  onRoleChanged?: () => void;
  /** Callback after user leaves team */
  onLeft?: () => void;
}

/**
 * Team member list with search, invite button, and member rows.
 * Displays member count as "X/Y members" per CONTEXT.md.
 *
 * @param props - Component props
 */
export function TeamMemberList({
  teamId,
  teamName,
  members,
  memberLimit,
  currentUserRole,
  currentUserId,
  onMemberRemoved,
  onRoleChanged,
  onLeft,
}: TeamMemberListProps) {
  const { query, setQuery, results, highlightMatch } = useMemberSearch(members);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  const utils = api.useUtils();

  const inviteMutation = api.team.invite.useMutation({
    onSuccess: () => {
      void utils.team.listInvites.invalidate({ id: teamId });
    },
  });

  const removeMutation = api.team.removeMember.useMutation({
    onSuccess: () => {
      void utils.team.listMembers.invalidate({ id: teamId });
      void utils.team.getById.invalidate({ id: teamId });
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
      onMemberRemoved?.();
    },
  });

  const changeRoleMutation = api.team.changeRole.useMutation({
    onSuccess: () => {
      void utils.team.listMembers.invalidate({ id: teamId });
      onRoleChanged?.();
    },
  });

  const leaveMutation = api.team.leave.useMutation({
    onSuccess: () => {
      void utils.team.list.invalidate();
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
    return inviteMutation.mutateAsync({ teamId, email, sendEmail });
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
      removeMutation.mutate({ teamId, userId: memberToRemove.userId });
    }
  };

  /**
   * Handle role change action.
   * @param userId - User ID to change role for
   * @param newRole - New role to assign
   */
  const handleChangeRole = (userId: string, newRole: "admin" | "member") => {
    changeRoleMutation.mutate({ teamId, userId, newRole });
  };

  /**
   * Handle self-leave action.
   */
  const handleLeave = () => {
    leaveMutation.mutate({ teamId });
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
            <TeamMemberRow
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
        teamName={teamName}
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
