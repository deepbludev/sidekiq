"use client";

import { usePathname } from "next/navigation";

import { cn } from "@sidekiq/lib/utils";
import { getActiveFeature } from "@sidekiq/lib/sidebar-utils";

/**
 * Secondary panel container for the two-tier sidebar.
 *
 * Renders contextual content based on the current URL pathname.
 * Uses `hidden` class (display:none) for inactive panels instead of
 * conditional rendering to preserve component state (e.g., TanStack Virtual
 * scroll position) when switching between panels.
 *
 * The actual panel components (SidebarPanelChats, SidebarPanelSidekiqs,
 * SidebarPanelTeams) will be added in Plan 02. For now, placeholder
 * content is rendered so the layout is testable.
 *
 * @example
 * ```tsx
 * <div className="flex h-full">
 *   <SidebarIconRail />
 *   <Separator orientation="vertical" />
 *   <SidebarPanel />
 * </div>
 * ```
 */
export function SidebarPanel() {
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
        {/* SidebarPanelChats will be added in Plan 02 */}
        <div className="text-sidebar-foreground p-4 text-sm">
          Chats Panel (placeholder)
        </div>
      </div>
      <div
        className={cn(
          "flex h-full flex-col",
          activeFeature !== "sidekiqs" && "hidden",
        )}
      >
        {/* SidebarPanelSidekiqs will be added in Plan 02 */}
        <div className="text-sidebar-foreground p-4 text-sm">
          Sidekiqs Panel (placeholder)
        </div>
      </div>
      <div
        className={cn(
          "flex h-full flex-col",
          activeFeature !== "teams" && "hidden",
        )}
      >
        {/* SidebarPanelTeams will be added in Plan 02 */}
        <div className="text-sidebar-foreground p-4 text-sm">
          Teams Panel (placeholder)
        </div>
      </div>
    </div>
  );
}
