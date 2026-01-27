"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import Fuse from "fuse.js";

import { Button } from "@sidekiq/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sidekiq/ui/dropdown-menu";
import { Input } from "@sidekiq/ui/input";
import { Skeleton } from "@sidekiq/ui/skeleton";
import { api } from "@sidekiq/shared/trpc/react";
import { SidekiqAvatar } from "./sidekiq-avatar";

/**
 * Sidekiqs panel for the two-tier sidebar.
 *
 * Displays the full list of user's Sidekiqs with search filtering,
 * create action, and click-to-chat behavior. This is an expanded
 * version designed to fill an entire sidebar panel.
 *
 * Structure:
 * - Header with "Sidekiqs" title and create button
 * - Search input for filtering by name (Fuse.js, threshold 0.4)
 * - Scrollable list: favorites first, then recent by lastUsedAt
 * - Each item: avatar + name + star + hover edit dropdown
 * - Empty/loading states
 * - "See all" link to /sidekiqs management page
 *
 * @example
 * ```tsx
 * <SidebarPanelSidekiqs />
 * ```
 */
export function SidebarPanelSidekiqs() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sidekiqs, isLoading } = api.sidekiq.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Sort: favorites first, then recent by lastUsedAt
  const sortedSidekiqs = useMemo(() => {
    if (!sidekiqs) return [];
    const favorites = sidekiqs.filter((s) => s.isFavorite);
    const recent = sidekiqs.filter((s) => !s.isFavorite);
    return [...favorites, ...recent];
  }, [sidekiqs]);

  // Fuse.js fuzzy search (threshold 0.4, matching project pattern)
  const fuse = useMemo(
    () =>
      new Fuse(sortedSidekiqs, {
        keys: ["name"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [sortedSidekiqs],
  );

  const filteredSidekiqs = useMemo(() => {
    if (!searchQuery.trim()) return sortedSidekiqs;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [fuse, searchQuery, sortedSidekiqs]);

  /**
   * Navigate to chat with the selected Sidekiq.
   */
  const handleSidekiqClick = (id: string) => {
    router.push(`/chat?sidekiq=${id}`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="text-sidebar-foreground text-sm font-semibold">
          Sidekiqs
        </h2>
        <Button variant="ghost" size="icon-sm" asChild className="size-7">
          <Link href="/sidekiqs/new">
            <Plus className="size-4" />
            <span className="sr-only">Create Sidekiq</span>
          </Link>
        </Button>
      </div>

      {/* Search input */}
      <div className="relative px-3 py-2">
        <Search className="text-muted-foreground absolute top-1/2 left-5 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search sidekiqs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-sidebar-border placeholder:text-muted-foreground focus-visible:ring-sidebar-ring h-9 border bg-transparent pl-8 focus-visible:ring-1"
        />
      </div>

      {/* Sidekiq list */}
      <div className="flex-1 overflow-auto px-2">
        {isLoading ? (
          <div className="space-y-1 py-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        ) : filteredSidekiqs.length === 0 && !searchQuery.trim() ? (
          /* Empty state -- no sidekiqs at all */
          <div className="px-2 py-8 text-center">
            <div className="bg-muted mx-auto mb-3 w-fit rounded-full p-3">
              <Sparkles className="text-muted-foreground size-5" />
            </div>
            <p className="text-muted-foreground mb-2 text-sm">
              No Sidekiqs yet
            </p>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/sidekiqs/new">
                <Sparkles className="mr-2 size-3.5" />
                Create your first Sidekiq
              </Link>
            </Button>
          </div>
        ) : filteredSidekiqs.length === 0 ? (
          /* No search results */
          <div className="px-2 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No Sidekiqs match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            {filteredSidekiqs.map((sidekiq) => (
              <div key={sidekiq.id} className="group relative">
                <button
                  onClick={() => handleSidekiqClick(sidekiq.id)}
                  className="hover:bg-sidebar-accent/50 text-sidebar-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 pr-8 text-left text-sm transition-colors"
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
                      className="absolute top-1/2 right-1 size-6 -translate-y-1/2 opacity-0 group-hover:opacity-100"
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
          </div>
        )}
      </div>

      {/* See all link */}
      {sidekiqs && sidekiqs.length > 0 && (
        <div className="border-sidebar-border border-t px-3 py-2">
          <Link
            href="/sidekiqs"
            className="text-muted-foreground hover:text-sidebar-foreground block text-center text-xs hover:underline"
          >
            See all {sidekiqs.length} Sidekiqs
          </Link>
        </div>
      )}
    </div>
  );
}
