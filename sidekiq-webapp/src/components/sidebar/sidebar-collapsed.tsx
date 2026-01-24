"use client";

import Link from "next/link";
import { PenSquare, Sparkles, Settings } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sidekiq/components/ui/tooltip";

/**
 * Props for the SidebarCollapsed component.
 */
interface SidebarCollapsedProps {
  /** Callback when New Chat button is clicked */
  onNewChat: () => void;
}

/**
 * Icon rail view shown when sidebar is collapsed.
 *
 * Displays a vertical stack of icon buttons with tooltips:
 * - New Chat: Creates a new conversation
 * - Sidekiqs: Access to custom assistants (placeholder)
 * - Settings: Application settings (placeholder)
 *
 * Similar to Linear/Notion collapsed sidebar pattern.
 *
 * @param props - Component props
 * @param props.onNewChat - Callback when New Chat is clicked
 *
 * @example
 * ```tsx
 * <SidebarCollapsed onNewChat={() => router.push("/chat")} />
 * ```
 */
export function SidebarCollapsed({ onNewChat }: SidebarCollapsedProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-3">
      {/* Logo */}
      <div className="mb-2 flex items-center justify-center">
        <span className="text-lg font-bold">S</span>
      </div>

      {/* New Chat */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            aria-label="New Chat"
          >
            <PenSquare className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">New Chat</TooltipContent>
      </Tooltip>

      {/* Sidekiqs */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" asChild aria-label="Sidekiqs">
            <Link href="/sidekiqs">
              <Sparkles className="size-5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Sidekiqs</TooltipContent>
      </Tooltip>

      {/* Settings - placeholder, no action yet */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
            disabled
            className="opacity-50"
          >
            <Settings className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Settings</TooltipContent>
      </Tooltip>
    </div>
  );
}
