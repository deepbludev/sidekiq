"use client";

import type { RefObject } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@sidekiq/shared/lib/utils";
import { getActiveFeature } from "@sidekiq/shared/lib/sidebar-utils";

import { SidebarPanelChats } from "./sidebar-panel-chats";
import { SidebarPanelSidekiqs } from "./sidebar-panel-sidekiqs";
import { SidebarPanelTeams } from "./sidebar-panel-teams";

/**
 * Props for the SidebarPanel component.
 */
interface SidebarPanelProps {
  /** Ref for the search input -- forwarded to SidebarPanelChats for Cmd+K focus */
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Secondary panel container for the two-tier sidebar.
 *
 * Renders contextual content based on the current URL pathname.
 * Uses `hidden` class (display:none) for inactive panels instead of
 * conditional rendering to preserve component state (e.g., TanStack Virtual
 * scroll position) when switching between panels.
 *
 * @param props.searchInputRef - Ref passed to SidebarPanelChats for Cmd+K shortcut
 *
 * @example
 * ```tsx
 * <div className="flex h-full">
 *   <SidebarIconRail />
 *   <Separator orientation="vertical" />
 *   <SidebarPanel searchInputRef={searchInputRef} />
 * </div>
 * ```
 */
export function SidebarPanel({ searchInputRef }: SidebarPanelProps) {
  const pathname = usePathname();
  const activeFeature = getActiveFeature(pathname ?? "/chat");

  return (
    <div className="bg-sidebar flex h-full w-72 shrink-0 flex-col overflow-hidden">
      {/* All panels stay mounted -- hidden/block preserves scroll position */}
      <div
        className={cn(
          "flex h-full flex-col",
          activeFeature !== "chats" && "hidden",
        )}
      >
        <SidebarPanelChats searchInputRef={searchInputRef} />
      </div>
      <div
        className={cn(
          "flex h-full flex-col",
          activeFeature !== "sidekiqs" && "hidden",
        )}
      >
        <SidebarPanelSidekiqs />
      </div>
      <div
        className={cn(
          "flex h-full flex-col",
          activeFeature !== "teams" && "hidden",
        )}
      >
        <SidebarPanelTeams />
      </div>
    </div>
  );
}
