"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Settings, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@sidekiq/lib/utils";
import { SidebarMobileOverlay } from "./sidebar-mobile-overlay";

/**
 * Props for the TabButton sub-component.
 */
interface TabButtonProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tab label text */
  label: string;
  /** Whether this tab is currently active */
  isActive: boolean;
  /** Click handler */
  onClick: () => void;
}

/**
 * Individual tab button in the bottom tab bar.
 *
 * Shows an icon and label with active state coloring.
 */
function TabButton({ icon: Icon, label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 px-3 py-1",
        isActive
          ? "text-sidebar-primary"
          : "text-sidebar-foreground/70 active:text-sidebar-foreground",
      )}
    >
      <Icon className="size-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

/**
 * Fixed bottom tab bar for mobile navigation.
 *
 * Visible only below the `md` breakpoint (768px). Replaces the old
 * hamburger-menu Sheet drawer with a native-feeling bottom tab bar
 * following iOS/Android conventions for thumb reachability.
 *
 * Three tabs:
 * - **Chats** -- opens full-screen overlay with SidebarPanelChats
 * - **Sidekiqs** -- opens full-screen overlay with SidebarPanelSidekiqs
 * - **Settings** -- navigates to /settings (no overlay)
 *
 * The overlay auto-closes on pathname change (e.g., when the user taps
 * a thread or Sidekiq inside the overlay).
 *
 * @example
 * ```tsx
 * <SidebarMobileTabs />
 * ```
 */
export function SidebarMobileTabs() {
  const [activeOverlay, setActiveOverlay] = useState<
    "chats" | "sidekiqs" | null
  >(null);
  const pathname = usePathname();
  const router = useRouter();

  /**
   * Auto-close overlay when pathname changes (e.g., user tapped a thread).
   */
  useEffect(() => {
    setActiveOverlay(null);
  }, [pathname]);

  return (
    <>
      {/* Bottom tab bar -- fixed at bottom, hidden on desktop */}
      <nav className="bg-sidebar border-sidebar-border fixed right-0 bottom-0 left-0 z-40 flex h-14 items-center justify-around border-t pb-[env(safe-area-inset-bottom)] md:hidden">
        <TabButton
          icon={MessageSquare}
          label="Chats"
          isActive={activeOverlay === "chats"}
          onClick={() =>
            setActiveOverlay(activeOverlay === "chats" ? null : "chats")
          }
        />
        <TabButton
          icon={Sparkles}
          label="Sidekiqs"
          isActive={activeOverlay === "sidekiqs"}
          onClick={() =>
            setActiveOverlay(activeOverlay === "sidekiqs" ? null : "sidekiqs")
          }
        />
        <TabButton
          icon={Settings}
          label="Settings"
          isActive={false}
          onClick={() => {
            setActiveOverlay(null);
            router.push("/settings");
          }}
        />
      </nav>

      {/* Full-screen overlay when a tab is active */}
      {activeOverlay && (
        <SidebarMobileOverlay
          feature={activeOverlay}
          onClose={() => setActiveOverlay(null)}
        />
      )}
    </>
  );
}
