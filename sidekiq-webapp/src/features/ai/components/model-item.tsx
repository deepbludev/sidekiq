"use client";

import { Check, Star } from "lucide-react";
import { CommandItem } from "@sidekiq/ui/command";
import { ProviderIcon } from "@sidekiq/shared/icons/provider-icons";
import type { ModelConfig } from "../api/models-metadata";
import { ModelHoverCard } from "./model-hover-card";
import { cn } from "@sidekiq/shared/lib/utils";
// CRITICAL: Import Tooltip components for favorite button
import { Tooltip, TooltipContent, TooltipTrigger } from "@sidekiq/ui/tooltip";

interface ModelItemProps {
  model: ModelConfig;
  isSelected: boolean;
  isFavorite: boolean;
  isDefault: boolean;
  onSelect: (modelId: string) => void;
  onToggleFavorite: (modelId: string) => void;
}

/**
 * Individual model row in the picker.
 * Shows provider icon, model name, description, favorite toggle, and selection state.
 * Wrapped in HoverCard for detailed info on hover.
 */
export function ModelItem({
  model,
  isSelected,
  isFavorite,
  isDefault,
  onSelect,
  onToggleFavorite,
}: ModelItemProps) {
  return (
    <ModelHoverCard model={model}>
      <CommandItem
        value={model.id}
        onSelect={() => onSelect(model.id)}
        className="flex items-center gap-3 py-2.5"
      >
        <ProviderIcon provider={model.provider} className="h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{model.name}</span>
            {isDefault && (
              <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
                default
              </span>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {model.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(model.id);
                }}
                className={cn(
                  "hover:bg-accent rounded p-1",
                  isFavorite
                    ? "text-yellow-500"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
              >
                <Star
                  className={cn("h-3.5 w-3.5", isFavorite && "fill-current")}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isFavorite ? "Remove from favorites" : "Add to favorites"}
            </TooltipContent>
          </Tooltip>
          {isSelected && <Check className="text-primary h-4 w-4" />}
        </div>
      </CommandItem>
    </ModelHoverCard>
  );
}
