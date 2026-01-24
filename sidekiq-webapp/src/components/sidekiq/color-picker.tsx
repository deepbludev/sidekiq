"use client";

import { Check } from "lucide-react";

import { cn } from "@sidekiq/lib/utils";
import { AVATAR_COLORS, type AvatarColor } from "@sidekiq/lib/utils/avatar";

interface ColorPickerProps {
  value: string;
  onChange: (color: AvatarColor) => void;
}

/**
 * Color picker with preset palette.
 * Shows 12 colors in a grid, selected color has checkmark.
 */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {AVATAR_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "focus:ring-ring relative size-8 rounded-full transition-transform hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-none",
            value === color && "ring-ring ring-2 ring-offset-2",
          )}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
          aria-pressed={value === color}
        >
          {value === color && (
            <Check className="absolute inset-0 m-auto size-4 text-white" />
          )}
        </button>
      ))}
    </div>
  );
}
