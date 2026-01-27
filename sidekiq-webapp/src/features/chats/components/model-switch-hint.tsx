import { Separator } from "@sidekiq/ui/separator";
import { getModelConfig } from "@sidekiq/ai/api/models-metadata";

interface ModelSwitchHintProps {
  previousModel: string;
  currentModel: string;
}

/**
 * Inline hint showing when the model was switched mid-conversation.
 * Displayed as a subtle divider with model names.
 */
export function ModelSwitchHint({
  previousModel,
  currentModel,
}: ModelSwitchHintProps) {
  const prevConfig = getModelConfig(previousModel);
  const currConfig = getModelConfig(currentModel);

  return (
    <div className="flex items-center gap-3 py-3">
      <Separator className="flex-1" />
      <span className="text-muted-foreground text-xs">
        Switched from {prevConfig?.name ?? previousModel} to{" "}
        {currConfig?.name ?? currentModel}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
