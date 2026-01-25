"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Sparkles, Plus } from "lucide-react";

import { api } from "@sidekiq/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@sidekiq/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@sidekiq/components/ui/command";
import { SidekiqAvatar } from "./sidekiq-avatar";

interface SidekiqPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Command palette dialog for selecting a Sidekiq to chat with.
 * Opened via Cmd+Shift+S keyboard shortcut.
 *
 * Features:
 * - Fuzzy search with typo tolerance (Fuse.js threshold 0.4)
 * - Shows favorites first
 * - "Create new" option
 *
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 */
export function SidekiqPicker({ open, onOpenChange }: SidekiqPickerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: sidekiqs } = api.sidekiq.list.useQuery(undefined, {
    enabled: open, // Only fetch when open
  });

  // Fuzzy search with Fuse.js (threshold 0.4 per project pattern)
  const fuse = useMemo(
    () =>
      new Fuse(sidekiqs ?? [], {
        keys: ["name", "description"],
        threshold: 0.4,
      }),
    [sidekiqs],
  );

  const filteredSidekiqs = useMemo(() => {
    if (!sidekiqs) return [];
    if (!search.trim()) return sidekiqs;
    return fuse.search(search).map((r) => r.item);
  }, [sidekiqs, search, fuse]);

  // Separate favorites and others
  const favorites = filteredSidekiqs.filter((s) => s.isFavorite);
  const others = filteredSidekiqs.filter((s) => !s.isFavorite);

  /**
   * Handle selecting a Sidekiq to start a chat with.
   * Navigates to /chat?sidekiq={id} and closes the dialog.
   */
  const handleSelect = (sidekiqId: string) => {
    router.push(`/chat?sidekiq=${sidekiqId}`);
    onOpenChange(false);
    setSearch("");
  };

  /**
   * Handle creating a new Sidekiq.
   * Navigates to /sidekiqs/new and closes the dialog.
   */
  const handleCreateNew = () => {
    router.push("/sidekiqs/new");
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Select a Sidekiq</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search Sidekiqs..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center py-6">
                <Sparkles className="text-muted-foreground mb-2 h-8 w-8" />
                <p className="text-sm">No Sidekiqs found</p>
                <button
                  onClick={handleCreateNew}
                  className="text-primary mt-2 text-sm hover:underline"
                >
                  Create a new Sidekiq
                </button>
              </div>
            </CommandEmpty>

            {favorites.length > 0 && (
              <CommandGroup heading="Favorites">
                {favorites.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.id}
                    onSelect={() => handleSelect(s.id)}
                    className="cursor-pointer"
                  >
                    <SidekiqAvatar
                      name={s.name}
                      avatar={s.avatar}
                      size="sm"
                      className="mr-2"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate">{s.name}</span>
                      {s.description && (
                        <span className="text-muted-foreground block truncate text-xs">
                          {s.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {others.length > 0 && (
              <>
                {favorites.length > 0 && <CommandSeparator />}
                <CommandGroup
                  heading={favorites.length > 0 ? "All Sidekiqs" : "Sidekiqs"}
                >
                  {others.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={s.id}
                      onSelect={() => handleSelect(s.id)}
                      className="cursor-pointer"
                    >
                      <SidekiqAvatar
                        name={s.name}
                        avatar={s.avatar}
                        size="sm"
                        className="mr-2"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate">{s.name}</span>
                        {s.description && (
                          <span className="text-muted-foreground block truncate text-xs">
                            {s.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={handleCreateNew}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new Sidekiq
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
