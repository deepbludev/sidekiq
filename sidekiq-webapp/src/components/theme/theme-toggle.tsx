"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@sidekiq/components/ui/toggle-group";
import { cn } from "@sidekiq/lib/utils";

/**
 * Theme toggle with segmented control showing Light/Dark/System options.
 * Uses mounted state to prevent hydration mismatch.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return placeholder with same dimensions to prevent layout shift
    return (
      <div className="bg-muted/50 h-9 w-[108px] animate-pulse rounded-md" />
    );
  }

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
      className="border-border bg-card rounded-lg border p-1"
    >
      <ToggleGroupItem
        value="light"
        aria-label="Light mode"
        className={cn(
          "data-[state=on]:bg-background h-7 w-8 rounded-md data-[state=on]:shadow-sm",
          "transition-all duration-200",
        )}
      >
        <Sun className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        aria-label="Dark mode"
        className={cn(
          "data-[state=on]:bg-background h-7 w-8 rounded-md data-[state=on]:shadow-sm",
          "transition-all duration-200",
        )}
      >
        <Moon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="system"
        aria-label="System preference"
        className={cn(
          "data-[state=on]:bg-background h-7 w-8 rounded-md data-[state=on]:shadow-sm",
          "transition-all duration-200",
        )}
      >
        <Monitor className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
