"use client";

import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Star, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Button } from "@sidekiq/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sidekiq/components/ui/dropdown-menu";
import { SidekiqAvatar } from "./sidekiq-avatar";

interface SidekiqCardProps {
  sidekiq: {
    id: string;
    name: string;
    description: string | null;
    avatar: { type: "initials" | "emoji"; color: string; emoji?: string };
    isFavorite: boolean;
    lastUsedAt: Date | null;
    threadCount: number;
  };
  viewMode: "grid" | "list";
  onToggleFavorite: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

/**
 * Card component for displaying a Sidekiq in grid or list view.
 * Shows avatar, name, description, usage stats, and quick actions.
 *
 * @param props.sidekiq - Sidekiq data to display
 * @param props.viewMode - Display mode: "grid" for cards, "list" for rows
 * @param props.onToggleFavorite - Callback when favorite status is toggled
 * @param props.onDuplicate - Callback when duplicate action is triggered
 * @param props.onDelete - Callback when delete action is triggered
 */
export function SidekiqCard({
  sidekiq,
  viewMode,
  onToggleFavorite,
  onDuplicate,
  onDelete,
}: SidekiqCardProps) {
  const lastUsedText = sidekiq.lastUsedAt
    ? `Used ${formatDistanceToNow(sidekiq.lastUsedAt, { addSuffix: true })}`
    : "Never used";

  const statsText = `${sidekiq.threadCount} chat${sidekiq.threadCount !== 1 ? "s" : ""}`;

  if (viewMode === "list") {
    return (
      <div className="hover:bg-accent/50 group flex items-center gap-4 rounded-lg border p-3 transition-colors">
        <SidekiqAvatar name={sidekiq.name} avatar={sidekiq.avatar} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/sidekiqs/${sidekiq.id}/edit`}
              className="font-medium hover:underline"
            >
              {sidekiq.name}
            </Link>
            {sidekiq.isFavorite && (
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
            )}
          </div>
          <p className="text-muted-foreground truncate text-sm">
            {sidekiq.description ?? "No description"}
          </p>
        </div>
        <div className="text-muted-foreground hidden text-sm md:block">
          {statsText}
        </div>
        <div className="text-muted-foreground hidden text-sm md:block">
          {lastUsedText}
        </div>
        <SidekiqCardActions
          sidekiq={sidekiq}
          onToggleFavorite={onToggleFavorite}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-card hover:bg-accent/30 group relative flex flex-col rounded-xl border p-4 transition-colors">
      <div className="mb-3 flex items-start justify-between">
        <SidekiqAvatar name={sidekiq.name} avatar={sidekiq.avatar} size="lg" />
        <SidekiqCardActions
          sidekiq={sidekiq}
          onToggleFavorite={onToggleFavorite}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
      <Link href={`/sidekiqs/${sidekiq.id}/edit`} className="group/link">
        <h3 className="mb-1 flex items-center gap-2 font-semibold group-hover/link:underline">
          {sidekiq.name}
          {sidekiq.isFavorite && (
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
          )}
        </h3>
      </Link>
      <p className="text-muted-foreground mb-3 line-clamp-2 flex-1 text-sm">
        {sidekiq.description ?? "No description"}
      </p>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <MessageSquare className="size-3" />
          {statsText}
        </span>
        <span>{lastUsedText}</span>
      </div>
    </div>
  );
}

/**
 * Dropdown menu with actions for a Sidekiq card.
 */
function SidekiqCardActions({
  sidekiq,
  onToggleFavorite,
  onDuplicate,
  onDelete,
}: Pick<
  SidekiqCardProps,
  "sidekiq" | "onToggleFavorite" | "onDuplicate" | "onDelete"
>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* NOTE: "Start chat" navigates to /chat?sidekiq=id which requires Phase 7 (Chat Integration).
            For now this will show a blank chat page. Full functionality comes in Phase 7. */}
        <DropdownMenuItem asChild>
          <Link href={`/chat?sidekiq=${sidekiq.id}`}>Start chat</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/sidekiqs/${sidekiq.id}/edit`}>Edit</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleFavorite(sidekiq.id)}>
          {sidekiq.isFavorite ? "Remove from favorites" : "Add to favorites"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(sidekiq.id)}>
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(sidekiq.id, sidekiq.name)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
