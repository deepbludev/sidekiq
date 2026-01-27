"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { SidekiqAvatar } from "@sidekiq/lib/validations/sidekiq";
import { SidekiqIndicator } from "@sidekiq/components/sidekiq/sidekiq-indicator";
import { Popover, PopoverContent, PopoverTrigger } from "@sidekiq/ui/popover";
import { Button } from "@sidekiq/ui/button";

interface ChatHeaderProps {
  /** Thread title (null for new threads) */
  title?: string | null;
  /** Active Sidekiq (null for regular chats) */
  sidekiq?: {
    id: string;
    name: string;
    description: string | null;
    avatar: SidekiqAvatar;
  } | null;
}

/**
 * Chat header showing thread title and/or active Sidekiq.
 *
 * - Regular chat: Shows thread title or "New Chat"
 * - Sidekiq chat: Shows Sidekiq indicator with popover for details
 */
export function ChatHeader({ title, sidekiq }: ChatHeaderProps) {
  if (!sidekiq) {
    // Regular chat - just show title
    return (
      <div className="border-border bg-background border-b px-4 py-3">
        <h1 className="text-foreground truncate text-sm font-medium">
          {title ?? "New Chat"}
        </h1>
      </div>
    );
  }

  // Sidekiq chat - show indicator with popover
  return (
    <div className="border-border bg-background border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="hover:bg-accent/50 -mx-2 rounded-md px-2 py-1 transition-colors">
              <SidekiqIndicator sidekiq={sidekiq} size="sm" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72">
            <div className="space-y-3">
              <SidekiqIndicator sidekiq={sidekiq} size="md" showDescription />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/sidekiqs/${sidekiq.id}/edit`}>
                    Edit Sidekiq
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {title && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground truncate text-sm">
              {title}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
