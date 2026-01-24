"use client";

import { Avatar, AvatarFallback } from "@sidekiq/components/ui/avatar";
import { cn } from "@sidekiq/lib/utils";
import { getInitials } from "@sidekiq/lib/utils/avatar";

interface SidekiqAvatarProps {
  name: string;
  avatar: {
    type: "initials" | "emoji";
    color: string;
    emoji?: string;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

/**
 * Avatar component for Sidekiqs.
 * Displays either initials or emoji with customizable background color.
 *
 * @param name - The Sidekiq name (used for initials extraction)
 * @param avatar - Avatar configuration with type, color, and optional emoji
 * @param size - Avatar size: sm (32px), md (40px), lg (48px)
 * @param className - Additional CSS classes
 */
export function SidekiqAvatar({
  name,
  avatar,
  size = "md",
  className,
}: SidekiqAvatarProps) {
  const initials = getInitials(name);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback
        style={{ backgroundColor: avatar.color }}
        className="font-semibold text-white"
      >
        {avatar.type === "emoji" ? avatar.emoji : initials}
      </AvatarFallback>
    </Avatar>
  );
}
