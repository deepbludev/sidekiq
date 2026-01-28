"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { Button } from "@sidekiq/ui/button";
import { WorkspaceAvatar } from "@sidekiq/workspace/components/workspace-avatar";
import { WorkspaceCreateDialog } from "@sidekiq/workspace/components/workspace-create-dialog";
import { useActiveWorkspace } from "@sidekiq/workspace/hooks/use-active-workspace";
import type { SidekiqAvatar } from "@sidekiq/shared/db/schema";
import { cn } from "@sidekiq/shared/lib/utils";

/**
 * Workspaces panel for the two-tier sidebar.
 *
 * Displays the full list of user's workspaces with active workspace highlighting,
 * create workspace functionality, and click-to-manage behavior. This is an
 * expanded version designed to fill an entire sidebar panel.
 *
 * Structure:
 * - Header with "Workspaces" title and create button
 * - Scrollable workspace list with active workspace highlighting
 * - Each item: workspace avatar + name + member count
 * - Empty state with create CTA
 * - WorkspaceCreateDialog for new workspace creation
 *
 * @example
 * ```tsx
 * <SidebarPanelWorkspaces />
 * ```
 */
export function SidebarPanelWorkspaces() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, isLoading } =
    useActiveWorkspace();

  // Return null during loading to avoid layout shift
  if (isLoading) {
    return null;
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Panel header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <h2 className="text-sidebar-foreground text-sm font-semibold">
            Workspaces
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="size-4" />
            <span className="sr-only">Create workspace</span>
          </Button>
        </div>

        {/* Workspace list */}
        <div className="flex-1 overflow-auto px-2">
          {workspaces.length === 0 ? (
            /* Empty state */
            <div className="px-2 py-8 text-center">
              <div className="bg-muted mx-auto mb-3 w-fit rounded-full p-3">
                <Users className="text-muted-foreground size-5" />
              </div>
              <p className="text-muted-foreground mb-2 text-sm">
                No workspaces yet
              </p>
              <p className="text-muted-foreground/70 mb-3 text-xs">
                Create one to start collaborating.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Users className="mr-2 size-3.5" />
                Create Workspace
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5 py-1">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/settings/teams?team=${workspace.id}`}
                  onClick={() => setActiveWorkspaceId(workspace.id)}
                  className={cn(
                    "hover:bg-sidebar-accent/50 text-sidebar-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    activeWorkspaceId === workspace.id && "bg-sidebar-accent",
                  )}
                >
                  <WorkspaceAvatar
                    avatar={workspace.avatar as SidekiqAvatar}
                    name={workspace.name}
                    size="sm"
                  />
                  <span className="flex-1 truncate">{workspace.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <WorkspaceCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
