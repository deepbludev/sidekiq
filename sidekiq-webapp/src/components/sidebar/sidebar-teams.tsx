"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@sidekiq/components/ui/collapsible";
import { TeamAvatar } from "@sidekiq/components/team/team-avatar";
import { TeamCreateDialog } from "@sidekiq/components/team/team-create-dialog";
import { useActiveTeam } from "@sidekiq/hooks/use-active-team";
import type { SidekiqAvatar } from "@sidekiq/server/db/schema";
import { cn } from "@sidekiq/lib/utils";

interface SidebarTeamsProps {
  /** Whether the sidebar is in collapsed mode */
  isCollapsed?: boolean;
}

/**
 * Teams section in the sidebar.
 * Shows user's teams with ability to create new ones.
 * Collapsed mode shows only icons.
 *
 * Features:
 * - Collapsible list of user's teams
 * - Create team button (+) opens TeamCreateDialog
 * - Clicking a team navigates to settings and sets as active
 * - Active team is highlighted
 *
 * @param isCollapsed - Whether sidebar is in collapsed mode
 *
 * @example
 * ```tsx
 * <SidebarTeams isCollapsed={false} />
 * ```
 */
export function SidebarTeams({ isCollapsed = false }: SidebarTeamsProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const { teams, activeTeamId, setActiveTeamId, isLoading } = useActiveTeam();

  if (isLoading) {
    return null; // Don't show loading state in sidebar
  }

  // Collapsed mode - just show icon
  if (isCollapsed) {
    return (
      <div className="px-2 py-1">
        <Link href="/settings/teams">
          <Button variant="ghost" size="icon" className="h-10 w-full">
            <Users className="size-5" />
            <span className="sr-only">Teams</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="px-2">
        <div className="flex items-center justify-between py-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1 px-2 font-semibold"
            >
              <Users className="size-4" />
              Teams
              {teams.length > 0 && (
                <span className="ml-1 text-xs">({teams.length})</span>
              )}
            </Button>
          </CollapsibleTrigger>

          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="size-4" />
            <span className="sr-only">Create team</span>
          </Button>
        </div>

        <CollapsibleContent className="space-y-1">
          {teams.length === 0 ? (
            <p className="text-muted-foreground px-2 py-2 text-xs">
              No teams yet. Create one to start collaborating.
            </p>
          ) : (
            teams.map((team) => (
              <Link
                key={team.id}
                href={`/settings/teams?team=${team.id}`}
                onClick={() => setActiveTeamId(team.id)}
                className={cn(
                  "hover:bg-muted flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  activeTeamId === team.id && "bg-muted",
                )}
              >
                <TeamAvatar
                  avatar={team.avatar as SidekiqAvatar}
                  name={team.name}
                  size="sm"
                />
                <span className="flex-1 truncate">{team.name}</span>
              </Link>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      <TeamCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
