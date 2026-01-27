"use client";

import { Avatar, AvatarFallback } from "@sidekiq/ui/avatar";
import { cn } from "@sidekiq/shared/lib/utils";
import { getInitials } from "@sidekiq/shared/lib/avatar";

interface TeamAvatarProps {
  name: string;
  avatar: {
    type: "initials" | "emoji";
    color: string;
    emoji?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
  xl: "size-12 text-lg",
};

/**
 * Avatar component for Teams.
 * Displays either initials or emoji with customizable background color.
 * Uses rounded-lg (vs rounded-full for user avatars) to distinguish team avatars visually.
 *
 * @param name - The team name (used for initials extraction)
 * @param avatar - Avatar configuration with type, color, and optional emoji
 * @param size - Avatar size: sm (24px), md (32px), lg (40px), xl (48px)
 * @param className - Additional CSS classes
 */
export function TeamAvatar({
  name,
  avatar,
  size = "md",
  className,
}: TeamAvatarProps) {
  const initials = getInitials(name);

  return (
    <Avatar className={cn(sizeClasses[size], "rounded-lg", className)}>
      <AvatarFallback
        style={{ backgroundColor: avatar.color }}
        className="rounded-lg font-semibold text-white"
      >
        {avatar.type === "emoji" ? avatar.emoji : initials}
      </AvatarFallback>
    </Avatar>
  );
}
