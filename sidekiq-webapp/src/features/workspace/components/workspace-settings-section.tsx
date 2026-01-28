"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, Users } from "lucide-react";

import { Button } from "@sidekiq/ui/button";
import { Input } from "@sidekiq/ui/input";
import { Label } from "@sidekiq/ui/label";
import { Separator } from "@sidekiq/ui/separator";
import { WorkspaceAvatar } from "@sidekiq/workspace/components/workspace-avatar";
import { WorkspaceMemberList } from "@sidekiq/workspace/components/workspace-member-list";
import { WorkspaceInvitesList } from "@sidekiq/workspace/components/workspace-invites-list";
import { DeleteWorkspaceDialog } from "@sidekiq/workspace/components/delete-workspace-dialog";
import { AvatarPicker } from "@sidekiq/sidekiqs/components/avatar-picker";
import { api } from "@sidekiq/shared/trpc/react";
import { toast } from "sonner";
import type { SidekiqAvatar } from "@sidekiq/shared/db/schema";
import {
  canDeleteWorkspace,
  type WorkspaceRole,
} from "@sidekiq/workspace/lib/permissions";

interface WorkspaceSettingsSectionProps {
  /** Workspace ID to display settings for */
  workspaceId: string;
  /** Current user's ID */
  currentUserId: string;
}

/**
 * Complete workspace settings section for the settings page.
 * Includes workspace info, members, invites, and danger zone.
 *
 * Per CONTEXT.md: Workspace settings inside user settings page.
 *
 * @param props - Component props
 */
export function WorkspaceSettingsSection({
  workspaceId,
  currentUserId,
}: WorkspaceSettingsSectionProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const utils = api.useUtils();

  // Queries
  const { data: workspace, isLoading: workspaceLoading } =
    api.workspace.getById.useQuery(
      { id: workspaceId },
      { enabled: !!workspaceId },
    );

  const { data: members = [] } = api.workspace.listMembers.useQuery(
    { id: workspaceId },
    { enabled: !!workspaceId },
  );

  const { data: invites = [] } = api.workspace.listInvites.useQuery(
    { id: workspaceId },
    {
      enabled:
        !!workspaceId &&
        (workspace?.userRole === "owner" || workspace?.userRole === "admin"),
    },
  );

  // Mutations
  const updateMutation = api.workspace.update.useMutation({
    onSuccess: () => {
      void utils.workspace.getById.invalidate({ id: workspaceId });
      void utils.workspace.list.invalidate();
      toast.success("Workspace updated");
      setEditingName(false);
      setEditingAvatar(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = api.workspace.delete.useMutation({
    onSuccess: () => {
      void utils.workspace.list.invalidate();
      toast.success("Workspace deleted");
      setDeleteDialogOpen(false);
      router.push("/chat");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (workspaceLoading || !workspace) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  const userRole = workspace.userRole;

  /**
   * Handle saving workspace name.
   */
  const handleSaveName = () => {
    if (nameValue.trim() && nameValue !== workspace.name) {
      updateMutation.mutate({ id: workspaceId, name: nameValue.trim() });
    } else {
      setEditingName(false);
    }
  };

  /**
   * Handle saving avatar.
   * @param avatar - New avatar configuration
   */
  const handleSaveAvatar = (avatar: SidekiqAvatar) => {
    updateMutation.mutate({ id: workspaceId, avatar });
  };

  /**
   * Handle workspace deletion.
   */
  const handleDelete = () => {
    deleteMutation.mutate({ id: workspaceId });
  };

  /**
   * Handle self-leave action.
   */
  const handleLeft = () => {
    router.push("/chat");
  };

  return (
    <div className="space-y-8">
      {/* Workspace Info Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="size-5" />
          <h2 className="text-lg font-semibold">Workspace Settings</h2>
        </div>

        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            {editingAvatar ? (
              <AvatarPicker
                value={workspace.avatar}
                onChange={handleSaveAvatar}
                name={workspace.name}
              />
            ) : (
              <button
                onClick={() => setEditingAvatar(true)}
                className="group relative"
                disabled={userRole !== "owner" && userRole !== "admin"}
                type="button"
              >
                <WorkspaceAvatar
                  avatar={workspace.avatar}
                  name={workspace.name}
                  size="xl"
                />
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
            <Label htmlFor="workspace-name">Workspace Name</Label>
            {editingName ? (
              <div className="flex gap-2">
                <Input
                  id="workspace-name"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="Workspace name"
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
                <span className="text-lg">{workspace.name}</span>
                {(userRole === "owner" || userRole === "admin") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNameValue(workspace.name);
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

        <WorkspaceMemberList
          workspaceId={workspaceId}
          workspaceName={workspace.name}
          members={members}
          memberLimit={workspace.memberLimit}
          currentUserRole={userRole}
          currentUserId={currentUserId}
          onLeft={handleLeft}
        />

        {(userRole === "owner" || userRole === "admin") &&
          invites.length > 0 && (
            <>
              <Separator className="my-6" />
              <WorkspaceInvitesList
                workspaceId={workspaceId}
                invites={invites}
              />
            </>
          )}
      </div>

      {/* Danger Zone */}
      {canDeleteWorkspace(userRole) && (
        <>
          <Separator />

          <div className="space-y-4">
            <h2 className="text-destructive text-lg font-semibold">
              Danger Zone
            </h2>

            <div className="border-destructive/50 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Delete Workspace</h3>
                  <p className="text-muted-foreground text-sm">
                    Permanently delete this workspace and all associated data.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Workspace
                </Button>
              </div>
            </div>
          </div>

          <DeleteWorkspaceDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDelete}
            workspaceName={workspace.name}
            memberCount={workspace.memberCount}
            isDeleting={deleteMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
