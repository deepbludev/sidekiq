"use client";

import type { DateGroup } from "@sidekiq/shared/lib/date-grouping";

interface SidebarThreadGroupProps {
  /** The date group to display */
  group: DateGroup;
}

/**
 * Date group header for sidebar thread list.
 *
 * Displays group name (Pinned, Today, Yesterday, etc.) with muted styling.
 * Used as sticky headers in the virtualized thread list.
 *
 * @example
 * ```tsx
 * <SidebarThreadGroup group="Today" />
 * ```
 */
export function SidebarThreadGroup({ group }: SidebarThreadGroupProps) {
  return (
    <div className="px-3 py-1.5">
      <span className="text-muted-foreground text-xs font-medium">{group}</span>
    </div>
  );
}
