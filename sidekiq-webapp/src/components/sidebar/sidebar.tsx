"use client";

import { useState, useRef } from "react";
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
import { useKeyboardShortcuts } from "@sidekiq/hooks/use-keyboard-shortcuts";

import { SidebarHeader } from "./sidebar-header";
import { SidebarCollapsed } from "./sidebar-collapsed";
import { SidebarSearch } from "./sidebar-search";
import { SidebarSidekiqs } from "./sidebar-sidekiqs";
import { SidebarThreadList } from "./sidebar-thread-list";
import { SidebarFooter } from "./sidebar-footer";

/**
 * Main sidebar component with collapse/expand behavior and search.
 *
 * Features:
 * - Collapsible with toggle button (Cmd+B keyboard shortcut)
 * - Search input with Cmd+K keyboard shortcut focus
 * - When expanded: header with logo + New Chat, search, thread list, footer
 * - When collapsed: icon rail with New Chat, Sidekiqs, Settings icons
 * - Smooth 200ms transition animation
 * - Persists collapsed state in localStorage
 *
 * Follows Linear/Notion-style sidebar pattern per design spec.
 *
 * @param props.onThreadSelect - Callback when a thread is selected (used by mobile drawer to close)
 *
 * @example
 * ```tsx
 * <div className="flex h-screen">
 *   <Sidebar />
 *   <main className="flex-1">{children}</main>
 * </div>
 * ```
 */

interface SidebarProps {
  /** Callback when a thread is selected (used by mobile drawer to close) */
  onThreadSelect?: () => void;
}

export function Sidebar({ onThreadSelect }: SidebarProps) {
  const router = useRouter();
  const { isCollapsed, toggle } = useSidebarState();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onNewChat: () => router.push("/chat"),
    onToggleSidebar: toggle,
    onFocusSearch: () => searchInputRef.current?.focus(),
  });

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

          {/* Sidekiqs section */}
          <div className="border-border/50 border-b pb-2">
            <SidebarSidekiqs onSidekiqSelect={onThreadSelect} />
          </div>

          {/* Search */}
          <SidebarSearch
            query={searchQuery}
            onQueryChange={setSearchQuery}
            inputRef={searchInputRef}
          />

          {/* Thread list */}
          <div className="flex-1 overflow-hidden">
            <SidebarThreadList
              searchQuery={searchQuery}
              onThreadSelect={onThreadSelect}
            />
          </div>

          {/* Footer with user menu */}
          <SidebarFooter isCollapsed={isCollapsed} />
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
