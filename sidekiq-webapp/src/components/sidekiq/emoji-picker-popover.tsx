"use client";

import { useMemo, useState } from "react";
import { Smile } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sidekiq/components/ui/popover";
import { Input } from "@sidekiq/components/ui/input";
import { cn } from "@sidekiq/shared/lib/utils";
import {
  EMOJI_CATEGORIES,
  searchEmojis,
} from "@sidekiq/shared/constants/emoji-data";
import type { EmojiEntry } from "@sidekiq/shared/constants/emoji-data";

interface EmojiPickerPopoverProps {
  value?: string;
  onChange: (emoji: string) => void;
  children?: React.ReactNode;
}

/**
 * Emoji picker in a popover with categorized browsing and name-based search.
 * Shows 150+ curated emojis organized across 8 categories for Sidekiq avatars.
 *
 * @param value - Currently selected emoji string
 * @param onChange - Callback receiving the selected emoji string
 * @param children - Optional custom trigger element
 */
export function EmojiPickerPopover({
  value,
  onChange,
  children,
}: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const searchResults = useMemo(() => searchEmojis(search), [search]);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setSearch("");
  };

  const renderEmojiButton = (entry: EmojiEntry) => (
    <button
      key={entry.emoji}
      type="button"
      title={entry.name}
      onClick={() => handleSelect(entry.emoji)}
      className={cn(
        "hover:bg-accent flex size-8 items-center justify-center rounded-md text-xl transition-colors",
        value === entry.emoji && "bg-accent",
      )}
    >
      {entry.emoji}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button type="button" variant="outline" size="sm" className="gap-2">
            {value ? (
              <span className="text-lg">{value}</span>
            ) : (
              <>
                <Smile className="size-4" />
                Pick emoji
              </>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          {/* Search - pinned above scroll area */}
          <Input
            type="search"
            placeholder="Search emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />

          {/* Scrollable emoji area */}
          <div className="max-h-[280px] overflow-y-auto">
            {search ? (
              /* Flat search results grid */
              searchResults.length > 0 ? (
                <div className="grid grid-cols-8 gap-1">
                  {searchResults.map(renderEmojiButton)}
                </div>
              ) : (
                <p className="text-muted-foreground py-2 text-center text-sm">
                  No emojis found
                </p>
              )
            ) : (
              /* Categorized grid with section headers */
              <div className="space-y-3">
                {EMOJI_CATEGORIES.map((category) => (
                  <div key={category.id}>
                    <p className="text-muted-foreground mb-1 text-xs font-medium">
                      {category.label}
                    </p>
                    <div className="grid grid-cols-8 gap-1">
                      {category.emojis.map(renderEmojiButton)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
