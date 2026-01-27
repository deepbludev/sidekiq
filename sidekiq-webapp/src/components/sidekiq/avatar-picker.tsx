"use client";

import { Type, Smile } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sidekiq/components/ui/popover";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@sidekiq/components/ui/toggle-group";
import { Label } from "@sidekiq/components/ui/label";
import { SidekiqAvatar } from "./sidekiq-avatar";
import { ColorPicker } from "./color-picker";
import { EmojiPickerPopover } from "./emoji-picker-popover";
import type { AvatarColor } from "@sidekiq/shared/lib/avatar";

interface SidekiqAvatarValue {
  type: "initials" | "emoji";
  color: string;
  emoji?: string;
}

interface AvatarPickerProps {
  name: string;
  value: SidekiqAvatarValue;
  onChange: (value: SidekiqAvatarValue) => void;
}

/**
 * Avatar customization picker.
 * Allows switching between initials and emoji, and selecting colors.
 */
export function AvatarPicker({ name, value, onChange }: AvatarPickerProps) {
  const handleTypeChange = (type: string) => {
    if (type === "initials" || type === "emoji") {
      onChange({
        ...value,
        type,
        emoji: type === "emoji" ? (value.emoji ?? "🤖") : undefined,
      });
    }
  };

  const handleColorChange = (color: AvatarColor) => {
    onChange({ ...value, color });
  };

  const handleEmojiChange = (emoji: string) => {
    onChange({ ...value, emoji, type: "emoji" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-auto gap-3 p-3">
          <SidekiqAvatar name={name} avatar={value} size="md" />
          <div className="text-left">
            <p className="text-sm font-medium">Customize avatar</p>
            <p className="text-muted-foreground text-xs">
              {value.type === "emoji" ? "Emoji" : "Initials"} on {value.color}
            </p>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <SidekiqAvatar name={name} avatar={value} size="lg" />
          </div>

          {/* Type toggle */}
          <div className="space-y-2">
            <Label>Avatar type</Label>
            <ToggleGroup
              type="single"
              value={value.type}
              onValueChange={handleTypeChange}
              className="justify-start"
            >
              <ToggleGroupItem value="initials" className="gap-2">
                <Type className="size-4" />
                Initials
              </ToggleGroupItem>
              <ToggleGroupItem value="emoji" className="gap-2">
                <Smile className="size-4" />
                Emoji
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Emoji picker (only when emoji type) */}
          {value.type === "emoji" && (
            <div className="space-y-2">
              <Label>Select emoji</Label>
              <EmojiPickerPopover
                value={value.emoji}
                onChange={handleEmojiChange}
              />
            </div>
          )}

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Background color</Label>
            <ColorPicker value={value.color} onChange={handleColorChange} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
