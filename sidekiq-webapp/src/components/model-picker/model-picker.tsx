"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@sidekiq/ui/popover";
import { TooltipProvider } from "@sidekiq/ui/tooltip";
import { getModelConfig } from "@sidekiq/lib/ai/models-metadata";
import { ModelPickerTrigger } from "./model-picker-trigger";
import { ModelPickerContent } from "./model-picker-content";

export interface ModelPickerProps {
  /** Currently selected model ID */
  value: string;
  /** Callback when model selection changes */
  onValueChange: (modelId: string) => void;
  /** User's favorite model IDs */
  favoriteModelIds?: string[];
  /** User's default model ID */
  defaultModelId?: string;
  /** Callback when user toggles a favorite */
  onToggleFavorite?: (modelId: string) => void;
  /** Whether the picker is disabled (e.g., during streaming) */
  disabled?: boolean;
  /** Additional class name for the trigger */
  className?: string;
}

/**
 * Rich model selection picker with fuzzy search, favorites, and provider grouping.
 *
 * Features:
 * - Fuzzy search with typo tolerance (Fuse.js)
 * - Favorites section pinned at top
 * - Models grouped by provider
 * - Hover card with model details
 * - Keyboard navigation (via cmdk)
 *
 * @example
 * ```tsx
 * <ModelPicker
 *   value={selectedModel}
 *   onValueChange={setSelectedModel}
 *   favoriteModelIds={["openai/gpt-4o"]}
 *   onToggleFavorite={handleToggleFavorite}
 * />
 * ```
 */
export function ModelPicker({
  value,
  onValueChange,
  favoriteModelIds = [],
  defaultModelId,
  onToggleFavorite,
  disabled = false,
  className,
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedModel = getModelConfig(value);

  const handleSelect = (modelId: string) => {
    onValueChange(modelId);
    setOpen(false);
  };

  const handleToggleFavorite = (modelId: string) => {
    onToggleFavorite?.(modelId);
  };

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <ModelPickerTrigger
            selectedModel={selectedModel}
            disabled={disabled}
            className={className}
          />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={4}
          className="border-border bg-popover w-[320px] p-0"
        >
          <ModelPickerContent
            selectedModelId={value}
            favoriteModelIds={favoriteModelIds}
            defaultModelId={defaultModelId}
            onSelect={handleSelect}
            onToggleFavorite={handleToggleFavorite}
          />
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
