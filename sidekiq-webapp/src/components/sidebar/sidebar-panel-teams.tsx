"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import { TeamAvatar } from "@sidekiq/components/team/team-avatar";
import { TeamCreateDialog } from "@sidekiq/components/team/team-create-dialog";
import { useActiveTeam } from "@sidekiq/hooks/use-active-team";
import type { SidekiqAvatar } from "@sidekiq/server/db/schema";
import { cn } from "@sidekiq/lib/utils";

/**
 * Teams panel for the two-tier sidebar.
 *
 * Displays the full list of user's teams with active team highlighting,
 * create team functionality, and click-to-manage behavior. This is an
 * expanded version of sidebar-teams.tsx designed to fill an entire panel.
 *
 * Structure:
 * - Header with "Teams" title and create button
 * - Scrollable team list with active team highlighting
 * - Each item: team avatar + name + member count
 * - Empty state with create CTA
 * - TeamCreateDialog for new team creation
 *
 * @example
 * ```tsx
 * <SidebarPanelTeams />
 * ```
 */
export function SidebarPanelTeams() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { teams, activeTeamId, setActiveTeamId, isLoading } = useActiveTeam();

  // Match existing sidebar-teams.tsx behavior: return null during loading
  if (isLoading) {
    return null;
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Panel header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <h2 className="text-sidebar-foreground text-sm font-semibold">
            Teams
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="size-4" />
            <span className="sr-only">Create team</span>
          </Button>
        </div>

        {/* Team list */}
        <div className="flex-1 overflow-auto px-2">
          {teams.length === 0 ? (
            /* Empty state */
            <div className="px-2 py-8 text-center">
              <div className="bg-muted mx-auto mb-3 w-fit rounded-full p-3">
                <Users className="text-muted-foreground size-5" />
              </div>
              <p className="text-muted-foreground mb-2 text-sm">No teams yet</p>
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
                Create Team
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5 py-1">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/settings/teams?team=${team.id}`}
                  onClick={() => setActiveTeamId(team.id)}
                  className={cn(
                    "hover:bg-sidebar-accent/50 text-sidebar-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    activeTeamId === team.id && "bg-sidebar-accent",
                  )}
                >
                  <TeamAvatar
                    avatar={team.avatar as SidekiqAvatar}
                    name={team.name}
                    size="sm"
                  />
                  <span className="flex-1 truncate">{team.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <TeamCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
