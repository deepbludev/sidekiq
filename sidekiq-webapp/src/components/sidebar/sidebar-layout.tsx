"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@sidekiq/lib/utils";
import { Separator } from "@sidekiq/components/ui/separator";
import { SidekiqPicker } from "@sidekiq/components/sidekiq/sidekiq-picker";
import { useKeyboardShortcuts } from "@sidekiq/hooks/use-keyboard-shortcuts";

import { SidebarIconRail } from "./sidebar-icon-rail";
import { SidebarPanel } from "./sidebar-panel";

/** localStorage key for panel collapsed state */
const PANEL_COLLAPSED_KEY = "sidebar-panel-collapsed";

/**
 * Two-tier sidebar layout composition with panel collapsibility and keyboard shortcuts.
 *
 * Composes the icon rail (48px / w-12), a vertical separator, and the
 * contextual panel (288px / w-72) as flex siblings. When the panel is
 * collapsed, only the icon rail (w-12) is visible.
 *
 * **Keyboard shortcuts:**
 * - Cmd/Ctrl+B: Toggle panel collapsed/expanded
 * - Cmd/Ctrl+K → C: Create new chat (chord shortcut)
 * - Cmd/Ctrl+K (no follow-up): Focus search input in chats panel
 * - Cmd/Ctrl+Shift+S: Open Sidekiq picker dialog
 *
 * **Panel toggle mechanisms:**
 * - Cmd+B keyboard shortcut
 * - Re-clicking the active icon in the rail
 *
 * Panel collapsed state is persisted in localStorage with SSR-safe
 * lazy initializer.
 *
 * @example
 * ```tsx
 * <div className="flex h-screen">
 *   <SidebarLayout />
 *   <main className="flex-1">{children}</main>
 * </div>
 * ```
 */
export function SidebarLayout() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sidekiqPickerOpen, setSidekiqPickerOpen] = useState(false);

  // SSR-safe localStorage persistence for panel collapsed state
  const [isPanelCollapsed, setIsPanelCollapsedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(PANEL_COLLAPSED_KEY) === "true";
  });

  /** Toggle panel collapsed state and persist to localStorage. */
  const togglePanel = useCallback(() => {
    setIsPanelCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem(PANEL_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onNewChat: () => router.push("/chat"),
    onToggleSidebar: togglePanel,
    onFocusSearch: () => {
      // Expand panel if collapsed before focusing search
      if (isPanelCollapsed) {
        setIsPanelCollapsedState(false);
        localStorage.setItem(PANEL_COLLAPSED_KEY, "false");
      }
      // Use setTimeout to ensure panel is visible before focusing
      setTimeout(() => searchInputRef.current?.focus(), 0);
    },
    onOpenSidekiqPicker: () => setSidekiqPickerOpen(true),
  });

  return (
    <>
      <aside
        className={cn(
          "border-sidebar-border flex h-full shrink-0 border-r transition-all duration-200 ease-out",
          isPanelCollapsed ? "w-12" : "w-[336px]",
        )}
      >
        <SidebarIconRail onIconReClick={togglePanel} />
        <Separator
          orientation="vertical"
          className={cn(
            "h-full transition-opacity duration-200",
            isPanelCollapsed && "opacity-0",
          )}
        />
        <div
          className={cn(
            "overflow-hidden transition-all duration-200 ease-out",
            isPanelCollapsed ? "w-0" : "w-72",
          )}
        >
          <SidebarPanel searchInputRef={searchInputRef} />
        </div>
      </aside>

      {/* Sidekiq picker dialog (Cmd+Shift+S) */}
      <SidekiqPicker
        open={sidekiqPickerOpen}
        onOpenChange={setSidekiqPickerOpen}
      />
    </>
  );
}
