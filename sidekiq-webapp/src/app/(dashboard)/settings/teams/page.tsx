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
import { TeamAvatar } from "@sidekiq/components/team/team-avatar";
import { TeamSettingsSection } from "@sidekiq/components/team/team-settings-section";
import { TeamEmptyState } from "@sidekiq/components/team/team-empty-state";
import { TeamCreateDialog } from "@sidekiq/components/team/team-create-dialog";
import { api } from "@sidekiq/shared/trpc/react";
import { authClient } from "@sidekiq/server/better-auth/client";
import type { SidekiqAvatar } from "@sidekiq/shared/db/schema";

/**
 * Team settings page.
 * Lists user's teams with dropdown to switch, and shows settings for selected team.
 */
export default function TeamSettingsPage() {
  const searchParams = useSearchParams();
  const selectedTeamId = searchParams.get("team");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const { data: teams = [], isLoading } = api.team.list.useQuery();

  // Find selected team or default to first
  const selectedTeam = selectedTeamId
    ? teams.find((t) => t.id === selectedTeamId)
    : teams[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading teams...</div>
      </div>
    );
  }

  // No teams - show empty state
  if (teams.length === 0) {
    return (
      <>
        <TeamEmptyState onCreateTeam={() => setCreateDialogOpen(true)} />
        <TeamCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Selector Header */}
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {selectedTeam && (
                <>
                  <TeamAvatar
                    avatar={selectedTeam.avatar}
                    name={selectedTeam.name}
                    size="sm"
                  />
                  <span>{selectedTeam.name}</span>
                </>
              )}
              <ChevronDown className="text-muted-foreground size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {teams.map((team) => (
              <DropdownMenuItem key={team.id} asChild>
                <a
                  href={`/settings/teams?team=${team.id}`}
                  className="flex items-center gap-2"
                >
                  <TeamAvatar avatar={team.avatar} name={team.name} size="sm" />
                  <span className="truncate">{team.name}</span>
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
          New Team
        </Button>
      </div>

      {/* Team Settings */}
      {selectedTeam && session?.user && (
        <TeamSettingsSection
          teamId={selectedTeam.id}
          currentUserId={session.user.id}
        />
      )}

      <TeamCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
