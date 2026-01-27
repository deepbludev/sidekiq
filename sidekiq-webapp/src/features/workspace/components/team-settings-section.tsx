"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, Users } from "lucide-react";

import { Button } from "@sidekiq/ui/button";
import { Input } from "@sidekiq/ui/input";
import { Label } from "@sidekiq/ui/label";
import { Separator } from "@sidekiq/ui/separator";
import { TeamAvatar } from "@sidekiq/workspace/components/team-avatar";
import { TeamMemberList } from "@sidekiq/workspace/components/team-member-list";
import { TeamInvitesList } from "@sidekiq/workspace/components/team-invites-list";
import { DeleteTeamDialog } from "@sidekiq/workspace/components/delete-team-dialog";
import { AvatarPicker } from "@sidekiq/sidekiqs/components/avatar-picker";
import { api } from "@sidekiq/shared/trpc/react";
import { toast } from "sonner";
import type { SidekiqAvatar } from "@sidekiq/shared/db/schema";
import {
  canDeleteTeam,
  type TeamRole,
} from "@sidekiq/workspace/lib/permissions";

interface TeamSettingsSectionProps {
  /** Team ID to display settings for */
  teamId: string;
  /** Current user's ID */
  currentUserId: string;
}

/**
 * Complete team settings section for the settings page.
 * Includes team info, members, invites, and danger zone.
 *
 * Per CONTEXT.md: Team settings inside user settings page.
 *
 * @param props - Component props
 */
export function TeamSettingsSection({
  teamId,
  currentUserId,
}: TeamSettingsSectionProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const utils = api.useUtils();

  // Queries
  const { data: team, isLoading: teamLoading } = api.team.getById.useQuery(
    { id: teamId },
    { enabled: !!teamId },
  );

  const { data: members = [] } = api.team.listMembers.useQuery(
    { id: teamId },
    { enabled: !!teamId },
  );

  const { data: invites = [] } = api.team.listInvites.useQuery(
    { id: teamId },
    {
      enabled:
        !!teamId && (team?.userRole === "owner" || team?.userRole === "admin"),
    },
  );

  // Mutations
  const updateMutation = api.team.update.useMutation({
    onSuccess: () => {
      void utils.team.getById.invalidate({ id: teamId });
      void utils.team.list.invalidate();
      toast.success("Team updated");
      setEditingName(false);
      setEditingAvatar(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = api.team.delete.useMutation({
    onSuccess: () => {
      void utils.team.list.invalidate();
      toast.success("Team deleted");
      setDeleteDialogOpen(false);
      router.push("/chat");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (teamLoading || !team) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  const userRole = team.userRole;

  /**
   * Handle saving team name.
   */
  const handleSaveName = () => {
    if (nameValue.trim() && nameValue !== team.name) {
      updateMutation.mutate({ id: teamId, name: nameValue.trim() });
    } else {
      setEditingName(false);
    }
  };

  /**
   * Handle saving avatar.
   * @param avatar - New avatar configuration
   */
  const handleSaveAvatar = (avatar: SidekiqAvatar) => {
    updateMutation.mutate({ id: teamId, avatar });
  };

  /**
   * Handle team deletion.
   */
  const handleDelete = () => {
    deleteMutation.mutate({ id: teamId });
  };

  /**
   * Handle self-leave action.
   */
  const handleLeft = () => {
    router.push("/chat");
  };

  return (
    <div className="space-y-8">
      {/* Team Info Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="size-5" />
          <h2 className="text-lg font-semibold">Team Settings</h2>
        </div>

        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            {editingAvatar ? (
              <AvatarPicker
                value={team.avatar}
                onChange={handleSaveAvatar}
                name={team.name}
              />
            ) : (
              <button
                onClick={() => setEditingAvatar(true)}
                className="group relative"
                disabled={userRole !== "owner" && userRole !== "admin"}
                type="button"
              >
                <TeamAvatar avatar={team.avatar} name={team.name} size="xl" />
                {(userRole === "owner" || userRole === "admin") && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs text-white">Edit</span>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Name */}
          <div className="flex-1 space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            {editingName ? (
              <div className="flex gap-2">
                <Input
                  id="team-name"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="Team name"
                  maxLength={100}
                  autoFocus
                />
                <Button
                  onClick={handleSaveName}
                  disabled={updateMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setEditingName(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg">{team.name}</span>
                {(userRole === "owner" || userRole === "admin") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNameValue(team.name);
                      setEditingName(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Members Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="size-5" />
          <h2 className="text-lg font-semibold">Members</h2>
        </div>

        <TeamMemberList
          teamId={teamId}
          teamName={team.name}
          members={members}
          memberLimit={team.memberLimit}
          currentUserRole={userRole}
          currentUserId={currentUserId}
          onLeft={handleLeft}
        />

        {(userRole === "owner" || userRole === "admin") &&
          invites.length > 0 && (
            <>
              <Separator className="my-6" />
              <TeamInvitesList teamId={teamId} invites={invites} />
            </>
          )}
      </div>

      {/* Danger Zone */}
      {canDeleteTeam(userRole) && (
        <>
          <Separator />

          <div className="space-y-4">
            <h2 className="text-destructive text-lg font-semibold">
              Danger Zone
            </h2>

            <div className="border-destructive/50 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Delete Team</h3>
                  <p className="text-muted-foreground text-sm">
                    Permanently delete this team and all associated data.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Team
                </Button>
              </div>
            </div>
          </div>

          <DeleteTeamDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDelete}
            teamName={team.name}
            memberCount={team.memberCount}
            isDeleting={deleteMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
