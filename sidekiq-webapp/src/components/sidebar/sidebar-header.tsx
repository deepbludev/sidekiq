"use client";

import { useRouter } from "next/navigation";
import { PenSquare } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sidekiq/components/ui/tooltip";

/**
 * Props for the SidebarHeader component.
 */
interface SidebarHeaderProps {
  /** Whether the sidebar is in collapsed state */
  isCollapsed: boolean;
}

/**
 * Sidebar header with logo and New Chat button.
 *
 * Displays the app logo (currently "S") and a prominent New Chat button.
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
    </div>
  );
}
