"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, ChevronDown } from "lucide-react";

import { Button } from "@sidekiq/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sidekiq/ui/dropdown-menu";
import { WorkspaceAvatar } from "@sidekiq/workspace/components/workspace-avatar";
import { WorkspaceSettingsSection } from "@sidekiq/workspace/components/workspace-settings-section";
import { WorkspaceEmptyState } from "@sidekiq/workspace/components/workspace-empty-state";
import { WorkspaceCreateDialog } from "@sidekiq/workspace/components/workspace-create-dialog";
import { api } from "@sidekiq/shared/trpc/react";
import { authClient } from "@sidekiq/auth/api/client";
import type { SidekiqAvatar } from "@sidekiq/shared/db/schema";

/**
 * Workspace settings page.
 * Lists user's workspaces with dropdown to switch, and shows settings for selected workspace.
 */
export default function WorkspaceSettingsPage() {
  const searchParams = useSearchParams();
  const selectedWorkspaceId = searchParams.get("team");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const { data: workspaces = [], isLoading } =
    api.workspace.list.useQuery();

  // Find selected workspace or default to first
  const selectedWorkspace = selectedWorkspaceId
    ? workspaces.find((w) => w.id === selectedWorkspaceId)
    : workspaces[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading workspaces...</div>
      </div>
    );
  }

  // No workspaces - show empty state
  if (workspaces.length === 0) {
    return (
      <>
        <WorkspaceEmptyState
          onCreateWorkspace={() => setCreateDialogOpen(true)}
        />
        <WorkspaceCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Selector Header */}
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {selectedWorkspace && (
                <>
                  <WorkspaceAvatar
                    avatar={selectedWorkspace.avatar}
                    name={selectedWorkspace.name}
                    size="sm"
                  />
                  <span>{selectedWorkspace.name}</span>
                </>
              )}
              <ChevronDown className="text-muted-foreground size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {workspaces.map((workspace) => (
              <DropdownMenuItem key={workspace.id} asChild>
                <a
                  href={`/settings/teams?team=${workspace.id}`}
                  className="flex items-center gap-2"
                >
                  <WorkspaceAvatar
                    avatar={workspace.avatar}
                    name={workspace.name}
                    size="sm"
                  />
                  <span className="truncate">{workspace.name}</span>
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 size-4" />
          New Workspace
        </Button>
      </div>

      {/* Workspace Settings */}
      {selectedWorkspace && session?.user && (
        <WorkspaceSettingsSection
          workspaceId={selectedWorkspace.id}
          currentUserId={session.user.id}
        />
      )}

      <WorkspaceCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
