"use client";

import { useState } from "react";
import { Grid3X3, List, Plus, Search } from "lucide-react";
import Link from "next/link";
import Fuse from "fuse.js";

import { Button } from "@sidekiq/components/ui/button";
import { Input } from "@sidekiq/components/ui/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@sidekiq/components/ui/toggle-group";
import { cn } from "@sidekiq/shared/lib/utils";
import { useViewPreference } from "@sidekiq/hooks/use-view-preference";
import { useSidekiqActions } from "@sidekiq/hooks/use-sidekiq-actions";
import { api } from "@sidekiq/shared/trpc/react";

import { SidekiqCard } from "./sidekiq-card";
import { SidekiqEmptyState } from "./sidekiq-empty-state";

interface SidekiqListProps {
  /** Callback to open the delete confirmation dialog */
  onOpenDeleteDialog: (id: string, name: string, threadCount: number) => void;
}

/**
 * Main list view for Sidekiqs with grid/list toggle and search.
 *
 * Features:
 * - Toggle between grid (cards) and list (rows) view
 * - View preference persists to localStorage
 * - Fuzzy search by name and description
 * - Loading skeleton while fetching
 * - Empty state when no Sidekiqs exist
 *
 * @param props.onOpenDeleteDialog - Callback to open delete dialog with sidekiq info
 */
export function SidekiqList({ onOpenDeleteDialog }: SidekiqListProps) {
  const { viewMode, setViewMode, isHydrated } = useViewPreference();
  const [searchQuery, setSearchQuery] = useState("");
  const { toggleFavorite, duplicateSidekiq } = useSidekiqActions();

  const { data: sidekiqs, isLoading } = api.sidekiq.list.useQuery();

  // Filter by search using Fuse.js for fuzzy matching
  const filteredSidekiqs = (() => {
    if (!sidekiqs) return [];
    if (!searchQuery.trim()) return sidekiqs;

    const fuse = new Fuse(sidekiqs, {
      keys: ["name", "description"],
      threshold: 0.4, // Per RESEARCH.md - matches model picker pattern
    });
    return fuse.search(searchQuery).map((r) => r.item);
  })();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="bg-muted h-10 w-64 animate-pulse rounded-md" />
          <div className="bg-muted h-10 w-32 animate-pulse rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!sidekiqs?.length) {
    return <SidekiqEmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Header with search and view toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search Sidekiqs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {isHydrated && (
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as "grid" | "list")}
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid3X3 className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          <Button asChild>
            <Link href="/sidekiqs/new">
              <Plus className="mr-2 size-4" />
              New Sidekiq
            </Link>
          </Button>
        </div>
      </div>

      {/* Results */}
      {filteredSidekiqs.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          No Sidekiqs match your search
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-2",
          )}
        >
          {filteredSidekiqs.map((sidekiq) => (
            <SidekiqCard
              key={sidekiq.id}
              sidekiq={sidekiq}
              viewMode={viewMode}
              onToggleFavorite={toggleFavorite}
              onDuplicate={duplicateSidekiq}
              onDelete={(id, name) =>
                onOpenDeleteDialog(id, name, sidekiq.threadCount)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
