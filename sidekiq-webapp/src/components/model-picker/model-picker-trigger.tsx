"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

import { Button } from "@sidekiq/components/ui/button";
import { ProviderIcon } from "@sidekiq/components/icons/provider-icons";
import type { ModelConfig } from "@sidekiq/lib/ai/models-metadata";
import { cn } from "@sidekiq/lib/utils";

interface ModelPickerTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  selectedModel: ModelConfig | undefined;
}

/**
 * Trigger button for the model picker popover.
 * Shows the selected model's provider icon and name.
 */
export const ModelPickerTrigger = forwardRef<
  HTMLButtonElement,
  ModelPickerTriggerProps
>(({ selectedModel, disabled, className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      disabled={disabled}
      className={cn(
        "h-8 gap-2 px-3",
        "bg-background hover:bg-accent/50",
        "border-border",
        className,
      )}
      {...props}
    >
      {selectedModel && (
        <ProviderIcon
          provider={selectedModel.provider}
          className="h-3.5 w-3.5"
        />
      )}
      <span className="text-sm font-medium">
        {selectedModel?.name ?? "Select model"}
      </span>
      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
    </Button>
  );
});
ModelPickerTrigger.displayName = "ModelPickerTrigger";
