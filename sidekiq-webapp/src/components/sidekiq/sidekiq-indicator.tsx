"use client";

import { SidekiqAvatar } from "./sidekiq-avatar";
import type { SidekiqAvatar as SidekiqAvatarType } from "@sidekiq/lib/validations/sidekiq";
import { cn } from "@sidekiq/lib/utils";

interface SidekiqIndicatorProps {
  sidekiq: {
    id: string;
    name: string;
    avatar: SidekiqAvatarType;
    description?: string | null;
  };
  /** Show description below name */
  showDescription?: boolean;
  /** Avatar size */
  size?: "sm" | "md" | "lg";
  /** Additional classes */
  className?: string;
  /** Click handler (for making it interactive) */
  onClick?: () => void;
}

/**
 * Displays a Sidekiq's avatar and name.
 * Used in chat header, input area badge, and sidebar.
 *
 * @example
 * ```tsx
 * <SidekiqIndicator
 *   sidekiq={sidekiq}
 *   size="sm"
 *   onClick={() => setPopoverOpen(true)}
 * />
 * ```
 */
export function SidekiqIndicator({
  sidekiq,
  showDescription = false,
  size = "md",
  className,
  onClick,
}: SidekiqIndicatorProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "flex items-center gap-2",
        onClick && "hover:bg-accent/50 rounded-md px-2 py-1 transition-colors",
        className,
      )}
    >
      <SidekiqAvatar name={sidekiq.name} avatar={sidekiq.avatar} size={size} />
      <div className="min-w-0 text-left">
        <span className="text-foreground block truncate text-sm font-medium">
          {sidekiq.name}
        </span>
        {showDescription && sidekiq.description && (
          <p className="text-muted-foreground truncate text-xs">
            {sidekiq.description}
          </p>
        )}
      </div>
    </Wrapper>
  );
}
