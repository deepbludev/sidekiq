"use client";

import { Users, Plus } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";

interface TeamEmptyStateProps {
  onCreateTeam: () => void;
}

/**
 * Empty state for team settings when user has no teams.
 * Per CONTEXT.md: Shows illustration + "Create your first team" CTA.
 *
 * @param onCreateTeam - Callback when create button is clicked
 */
export function TeamEmptyState({ onCreateTeam }: TeamEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="bg-primary/10 mb-6 flex size-16 items-center justify-center rounded-full">
        <Users className="text-primary size-8" />
      </div>

      <h3 className="mb-2 text-xl font-semibold">No teams yet</h3>

      <p className="text-muted-foreground mb-6 max-w-sm">
        Create a team to collaborate with others and share your custom Sidekiqs.
        Team members can access shared assistants and work together.
      </p>

      <Button onClick={onCreateTeam}>
        <Plus className="mr-2 size-4" />
        Create Your First Team
      </Button>
    </div>
  );
}
