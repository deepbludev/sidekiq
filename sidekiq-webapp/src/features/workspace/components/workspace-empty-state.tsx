"use client";

import { Users, Plus } from "lucide-react";

import { Button } from "@sidekiq/ui/button";

interface WorkspaceEmptyStateProps {
  onCreateWorkspace: () => void;
}

/**
 * Empty state for workspace settings when user has no workspaces.
 * Per CONTEXT.md: Shows illustration + "Create your first workspace" CTA.
 *
 * @param onCreateWorkspace - Callback when create button is clicked
 */
export function WorkspaceEmptyState({
  onCreateWorkspace,
}: WorkspaceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="bg-muted mb-6 flex size-16 items-center justify-center rounded-full">
        <Users className="text-muted-foreground size-8" />
      </div>

      <h3 className="mb-2 text-xl font-semibold">No workspaces yet</h3>

      <p className="text-muted-foreground mb-6 max-w-sm">
        Create a workspace to collaborate with others and share your custom
        Sidekiqs. Workspace members can access shared assistants and work
        together.
      </p>

      <Button onClick={onCreateWorkspace}>
        <Plus className="mr-2 size-4" />
        Create Your First Workspace
      </Button>
    </div>
  );
}
