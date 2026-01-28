"use client";

import { PenSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@sidekiq/ui/button";
import { SidebarPanelChats } from "@sidekiq/chats/components/sidebar-panel-chats";
import { SidebarPanelSidekiqs } from "@sidekiq/sidekiqs/components/sidebar-panel-sidekiqs";

/**
 * Props for the SidebarMobileOverlay component.
 */
interface SidebarMobileOverlayProps {
  /** Which feature panel to display */
  feature: "chats" | "sidekiqs";
  /** Callback when the overlay should close */
  onClose: () => void;
}

/**
 * Full-screen overlay for mobile panel content.
 *
 * Replaces the previous Sheet-based mobile drawer with a full-screen
 * overlay that slides up from the bottom. Provides more content space
 * and follows native mobile app conventions.
 *
 * Structure:
 * - Header with title, optional New Chat button (chats), and close button
 * - Content: renders SidebarPanelChats or SidebarPanelSidekiqs
 *
 * Only rendered on mobile (md:hidden). Animated via tw-animate-css
 * slide-in-from-bottom.
 *
 * @param props.feature - Which panel to display ("chats" or "sidekiqs")
 * @param props.onClose - Called when close button is tapped or overlay should dismiss
 *
 * @example
 * ```tsx
 * <SidebarMobileOverlay feature="chats" onClose={() => setOverlay(null)} />
 * ```
 */
export function SidebarMobileOverlay({
  feature,
  onClose,
}: SidebarMobileOverlayProps) {
  const router = useRouter();

  /** Title derived from feature name */
  const title = feature === "chats" ? "Chats" : "Sidekiqs";

  /**
   * Navigate to new chat and close overlay.
   */
  const handleNewChat = () => {
    router.push("/chat");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="bg-sidebar animate-in slide-in-from-bottom fixed inset-0 z-50 flex flex-col duration-200 md:hidden"
    >
      {/* Header with title, actions, and close button */}
      <div className="border-sidebar-border flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-sidebar-foreground text-sm font-semibold">
          {title}
        </h2>
        <div className="flex items-center gap-1">
          {feature === "chats" && (
            <Button variant="ghost" size="icon" onClick={handleNewChat}>
              <PenSquare className="size-5" />
              <span className="sr-only">New Chat</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
            <span className="sr-only">Close overlay</span>
          </Button>
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {feature === "chats" && <SidebarPanelChats />}
        {feature === "sidekiqs" && <SidebarPanelSidekiqs />}
      </div>
    </div>
  );
}
