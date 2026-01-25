"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, MoreHorizontal, Pencil, Plus, Sparkles, Star } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@sidekiq/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sidekiq/components/ui/dropdown-menu";
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
 * Clicking a Sidekiq starts a new chat with that Sidekiq.
 * Edit is accessible via the dropdown menu on hover.
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
    // Navigate to chat with this Sidekiq selected
    // Sidebar click always starts a new chat (edit accessible via dropdown)
    router.push(`/chat?sidekiq=${id}`);
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
              <div key={sidekiq.id} className="group relative">
                <button
                  onClick={() => handleSidekiqClick(sidekiq.id)}
                  className="hover:bg-accent/50 flex w-full items-center gap-2 rounded-md px-2 py-1.5 pr-8 text-left text-sm transition-colors"
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
                {/* Edit dropdown on hover */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 size-6 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/sidekiqs/${sidekiq.id}/edit`}>
                        <Pencil className="mr-2 size-3" />
                        Edit Sidekiq
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
