"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenSquare, ChevronDown, Check, Settings, Users } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sidekiq/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sidekiq/components/ui/tooltip";
import { TeamAvatar } from "@sidekiq/components/team/team-avatar";
import { useActiveTeam } from "@sidekiq/hooks/use-active-team";
import type { SidekiqAvatar } from "@sidekiq/server/db/schema";

/**
 * Props for the SidebarHeader component.
 */
interface SidebarHeaderProps {
  /** Whether the sidebar is in collapsed state */
  isCollapsed: boolean;
}

/**
 * Team dropdown component for switching between teams.
 * Only renders when user has teams.
 *
 * Shows:
 * - Personal option (no team selected)
 * - List of user's teams
 * - Manage Teams link to settings
 */
function TeamDropdown() {
  const { teams, activeTeam, setActiveTeamId } = useActiveTeam();

  // Only show if user has teams
  if (teams.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-full justify-start gap-2 px-2">
          {activeTeam ? (
            <>
              <TeamAvatar
                avatar={activeTeam.avatar as SidekiqAvatar}
                name={activeTeam.name}
                size="sm"
              />
              <span className="flex-1 truncate text-left">
                {activeTeam.name}
              </span>
            </>
          ) : (
            <>
              <Users className="size-4" />
              <span className="text-muted-foreground">Personal</span>
            </>
          )}
          <ChevronDown className="text-muted-foreground size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem
          onClick={() => setActiveTeamId(null)}
          className="flex items-center gap-2"
        >
          <div className="flex size-5 items-center justify-center">
            {!activeTeam && <Check className="size-4" />}
          </div>
          <span>Personal</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {teams.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => setActiveTeamId(team.id)}
            className="flex items-center gap-2"
          >
            <div className="flex size-5 items-center justify-center">
              {activeTeam?.id === team.id && <Check className="size-4" />}
            </div>
            <TeamAvatar
              avatar={team.avatar as SidekiqAvatar}
              name={team.name}
              size="sm"
            />
            <span className="truncate">{team.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/teams" className="flex items-center gap-2">
            <Settings className="size-4" />
            Manage Teams
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Sidebar header with logo, New Chat button, and team dropdown.
 *
 * Displays the app logo (currently "S"), a prominent New Chat button,
 * and a team dropdown for switching between teams (if user has teams).
 * Adapts to collapsed state by showing icon-only button with tooltip.
 *
 * @param props - Component props
 * @param props.isCollapsed - Whether the sidebar is collapsed
 *
 * @example
 * ```tsx
 * <SidebarHeader isCollapsed={false} />
 * ```
 */
export function SidebarHeader({ isCollapsed }: SidebarHeaderProps) {
  const router = useRouter();

  const handleNewChat = () => {
    router.push("/chat");
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Logo */}
      <div className="flex items-center justify-center">
        <span className={`font-bold ${isCollapsed ? "text-lg" : "text-xl"}`}>
          S
        </span>
      </div>

      {/* New Chat button */}
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="w-full"
              aria-label="New Chat"
            >
              <PenSquare className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">New Chat</TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="outline"
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
        >
          <PenSquare className="size-4" />
          <span>New Chat</span>
        </Button>
      )}

      {/* Team dropdown - only shown when expanded and user has teams */}
      {!isCollapsed && <TeamDropdown />}
    </div>
  );
}
