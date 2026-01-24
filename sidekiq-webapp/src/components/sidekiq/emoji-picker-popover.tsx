"use client";

import { useState } from "react";
import { Smile } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sidekiq/components/ui/popover";
import { Input } from "@sidekiq/components/ui/input";
import { cn } from "@sidekiq/lib/utils";

// Common emoji categories for Sidekiqs
const EMOJI_CATEGORIES = {
  faces: ["😀", "😊", "🤔", "😎", "🤖", "👻", "🎭", "🦊"],
  objects: ["💡", "🎯", "📚", "✏️", "🔧", "🎨", "🎵", "💻"],
  nature: ["🌟", "🔥", "⚡", "🌈", "🌊", "🌸", "🍀", "🌙"],
  symbols: ["❤️", "⭐", "💎", "🏆", "🎪", "🎲", "🎁", "🚀"],
};

const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

interface EmojiPickerPopoverProps {
  value?: string;
  onChange: (emoji: string) => void;
  children?: React.ReactNode;
}

/**
 * Simple emoji picker in a popover.
 * Shows commonly used emojis for Sidekiq avatars.
 */
export function EmojiPickerPopover({
  value,
  onChange,
  children,
}: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredEmojis = search
    ? ALL_EMOJIS.filter((emoji) =>
        emoji.toLowerCase().includes(search.toLowerCase()),
      )
    : ALL_EMOJIS;

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setSearch("");
  };

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
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          {/* Search */}
          <Input
            type="search"
            placeholder="Search emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />

          {/* Emoji grid */}
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelect(emoji)}
                className={cn(
                  "hover:bg-accent flex size-8 items-center justify-center rounded-md text-xl transition-colors",
                  value === emoji && "bg-accent",
                )}
              >
                {emoji}
              </button>
            ))}
          </div>

          {filteredEmojis.length === 0 && (
            <p className="text-muted-foreground py-2 text-center text-sm">
              No emojis found
            </p>
          )}

          {/* Category labels */}
          {!search && (
            <div className="text-muted-foreground text-xs">
              <span className="font-medium">Categories:</span> Faces, Objects,
              Nature, Symbols
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
