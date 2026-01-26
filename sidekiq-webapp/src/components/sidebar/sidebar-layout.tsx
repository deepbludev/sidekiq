"use client";

import { Separator } from "@sidekiq/components/ui/separator";
import { SidebarIconRail } from "./sidebar-icon-rail";
import { SidebarPanel } from "./sidebar-panel";

/**
 * Two-tier sidebar layout composition.
 *
 * Composes the icon rail (48px / w-12), a vertical separator, and the
 * contextual panel (288px / w-72) as flex siblings inside a fixed-width
 * container (336px / w-[336px]).
 *
 * The total width is fixed to prevent layout shift when panel content
 * changes. The main content area uses `flex-1` and is independent of
 * sidebar content.
 *
 * - `border-r` on the aside provides the outer sidebar border
 * - `Separator` provides a visual divider between rail and panel
 * - `shrink-0` prevents the main content area from compressing the sidebar
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
  return (
    <aside className="border-sidebar-border flex h-full w-[336px] shrink-0 border-r">
      <SidebarIconRail />
      <Separator orientation="vertical" className="h-full" />
      <SidebarPanel />
    </aside>
  );
}
