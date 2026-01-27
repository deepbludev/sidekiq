"use client";

import { useState, useRef, type RefObject } from "react";
import { ChevronDown, Check, Settings, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@sidekiq/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sidekiq/ui/dropdown-menu";
import { TeamAvatar } from "@sidekiq/components/team/team-avatar";
import { useActiveTeam } from "@sidekiq/hooks/use-active-team";
import type { SidekiqAvatar } from "@sidekiq/shared/db/schema";

import { SidebarSearch } from "@sidekiq/shared/layout/sidebar-search";
import { SidebarThreadList } from "./sidebar-thread-list";

/**
 * Props for the SidebarPanelChats component.
 */
interface SidebarPanelChatsProps {
  /** Ref for search input -- for Cmd+K shortcut focus */
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Team dropdown for filtering chats by team context.
 * Only renders when user has teams.
 *
 * Shows:
 * - Personal option (no team selected)
 * - List of user's teams with check indicator
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
        <Button variant="ghost" className="h-7 shrink-0 gap-1.5 px-2 text-xs">
          {activeTeam ? (
            <>
              <TeamAvatar
                avatar={activeTeam.avatar as SidekiqAvatar}
                name={activeTeam.name}
                size="sm"
                className="size-4"
              />
              <span className="max-w-[80px] truncate">{activeTeam.name}</span>
            </>
          ) : (
            <>
              <Users className="size-3.5" />
              <span className="text-muted-foreground">Personal</span>
            </>
          )}
          <ChevronDown className="text-muted-foreground size-3" />
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
 * Chats panel for the two-tier sidebar.
 *
 * Displays the chat thread list with search and team filtering.
 * This panel extracts the expanded sidebar content from the old sidebar.tsx
 * into a standalone panel component for the two-tier navigation architecture.
 *
 * Structure:
 * - Header with "Chats" title and team dropdown
 * - Search input (SidebarSearch)
 * - Virtualized thread list (SidebarThreadList)
 *
 * @param props.searchInputRef - Optional ref for Cmd+K focus
 *
 * @example
 * ```tsx
 * <SidebarPanelChats searchInputRef={searchInputRef} />
 * ```
 */
export function SidebarPanelChats({ searchInputRef }: SidebarPanelChatsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef ?? localInputRef;

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="text-sidebar-foreground text-sm font-semibold">Chats</h2>
        <TeamDropdown />
      </div>

      {/* Search */}
      <SidebarSearch
        query={searchQuery}
        onQueryChange={setSearchQuery}
        inputRef={inputRef}
      />

      {/* Thread list */}
      <div className="flex-1 overflow-hidden">
        <SidebarThreadList searchQuery={searchQuery} />
      </div>
    </div>
  );
}
