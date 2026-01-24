"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Sparkles, Star } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@sidekiq/components/ui/collapsible";
import { api } from "@sidekiq/trpc/react";
import { SidekiqAvatar } from "@sidekiq/components/sidekiq/sidekiq-avatar";

interface SidebarSidekiqsProps {
  onSidekiqSelect?: () => void;
}

/**
 * Sidebar section showing recent and favorited Sidekiqs.
 * Favorites appear first, then recent by lastUsedAt.
 * Shows max 5 items with "See all" link to /sidekiqs.
 *
 * NOTE: Clicking a Sidekiq navigates to edit page (/sidekiqs/[id]/edit).
 * Starting a chat with a Sidekiq (navigating to /chat?sidekiq=id) is Phase 7.
 *
 * @param props.onSidekiqSelect - Callback when a Sidekiq is selected (for mobile drawer close)
 */
export function SidebarSidekiqs({ onSidekiqSelect }: SidebarSidekiqsProps) {
  const router = useRouter();
  const { data: sidekiqs, isLoading } = api.sidekiq.list.useQuery(undefined, {
    // Only refetch on mount, not on every focus
    refetchOnWindowFocus: false,
  });

  // Show favorites first, then recent, max 5 total
  const displaySidekiqs = (() => {
    if (!sidekiqs) return [];
    const favorites = sidekiqs.filter((s) => s.isFavorite);
    const recent = sidekiqs.filter((s) => !s.isFavorite);
    return [...favorites, ...recent].slice(0, 5);
  })();

  const handleSidekiqClick = (id: string) => {
    // Navigate to edit page for this Sidekiq.
    // NOTE: Phase 7 will change this to start a chat (/chat?sidekiq=id).
    // For now, edit is the only meaningful action since chat integration isn't implemented.
    router.push(`/sidekiqs/${id}/edit`);
    onSidekiqSelect?.();
  };

  return (
    <Collapsible defaultOpen className="px-2">
      <div className="flex items-center justify-between px-2 py-1">
        <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1 text-xs font-medium tracking-wider uppercase">
          <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
          Sidekiqs
        </CollapsibleTrigger>
        <Button variant="ghost" size="icon-sm" asChild className="size-6">
          <Link href="/sidekiqs/new">
            <Plus className="size-3.5" />
          </Link>
        </Button>
      </div>
      <CollapsibleContent>
        {isLoading ? (
          <div className="space-y-1 py-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-muted mx-2 h-8 animate-pulse rounded-md"
              />
            ))}
          </div>
        ) : displaySidekiqs.length === 0 ? (
          <div className="px-2 py-3 text-center">
            <p className="text-muted-foreground mb-2 text-xs">
              No Sidekiqs yet
            </p>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/sidekiqs/new">
                <Sparkles className="mr-2 size-3.5" />
                Create first
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            {displaySidekiqs.map((sidekiq) => (
              <button
                key={sidekiq.id}
                onClick={() => handleSidekiqClick(sidekiq.id)}
                className="hover:bg-accent/50 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
              >
                <SidekiqAvatar
                  name={sidekiq.name}
                  avatar={sidekiq.avatar}
                  size="sm"
                  className="size-6"
                />
                <span className="flex-1 truncate">{sidekiq.name}</span>
                {sidekiq.isFavorite && (
                  <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                )}
              </button>
            ))}
            {sidekiqs && sidekiqs.length > 5 && (
              <Link
                href="/sidekiqs"
                className="text-muted-foreground hover:text-foreground block px-2 py-1.5 text-xs hover:underline"
              >
                See all {sidekiqs.length} Sidekiqs
              </Link>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
