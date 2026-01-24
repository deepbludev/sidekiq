"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@sidekiq/lib/utils";
import { Button } from "@sidekiq/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sidekiq/components/ui/tooltip";
import { useSidebarState } from "@sidekiq/hooks/use-sidebar-state";

import { SidebarHeader } from "./sidebar-header";
import { SidebarCollapsed } from "./sidebar-collapsed";
import { SidebarThreadList } from "./sidebar-thread-list";

/**
 * Main sidebar component with collapse/expand behavior.
 *
 * Features:
 * - Collapsible with toggle button (Cmd+B keyboard shortcut in parent)
 * - When expanded: header with logo + New Chat, placeholders for search/threads/footer
 * - When collapsed: icon rail with New Chat, Sidekiqs, Settings icons
 * - Smooth 200ms transition animation
 * - Persists collapsed state in localStorage
 *
 * Follows Linear/Notion-style sidebar pattern per design spec.
 *
 * @example
 * ```tsx
 * <div className="flex h-screen">
 *   <Sidebar />
 *   <main className="flex-1">{children}</main>
 * </div>
 * ```
 */
export function Sidebar() {
  const router = useRouter();
  const { isCollapsed, toggle } = useSidebarState();

  const handleNewChat = () => {
    router.push("/chat");
  };

  return (
    <aside
      className={cn(
        "border-border/50 bg-background relative flex h-full flex-col border-r transition-all duration-200 ease-out",
        isCollapsed ? "w-16" : "w-72",
      )}
    >
      {isCollapsed ? (
        <SidebarCollapsed onNewChat={handleNewChat} />
      ) : (
        <>
          <SidebarHeader isCollapsed={isCollapsed} />

          {/* Search placeholder - will be added in Plan 05-04 */}
          <div className="px-3 py-2">{/* SidebarSearch will go here */}</div>

          {/* Thread list */}
          <div className="flex-1 overflow-hidden">
            <SidebarThreadList />
          </div>

          {/* Footer placeholder - will be added in Plan 05-05 */}
          <div className="border-border/50 border-t p-3">
            {/* SidebarFooter will go here */}
          </div>
        </>
      )}

      {/* Collapse toggle button - positioned at bottom edge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            className={cn(
              "border-border/50 bg-background hover:bg-accent absolute bottom-4 z-10 rounded-full border shadow-sm",
              isCollapsed ? "right-[-12px]" : "right-[-12px]",
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        </TooltipContent>
      </Tooltip>
    </aside>
  );
}
