"use client";

import type { ReactNode } from "react";
import { Badge } from "@sidekiq/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@sidekiq/components/ui/hover-card";
import {
  ProviderIcon,
  getProviderDisplayName,
} from "@sidekiq/components/icons/provider-icons";
import type { ModelConfig, ModelFeature } from "@sidekiq/lib/ai/models";

interface ModelHoverCardProps {
  model: ModelConfig;
  children: ReactNode;
}

const featureLabels: Record<ModelFeature, string> = {
  fast: "Fast",
  thinking: "Deep Thinking",
  coding: "Coding",
  vision: "Vision",
  "long-context": "Long Context",
};

/**
 * Hover card showing model details.
 * Displays provider icon, name, description, feature badges, and knowledge cutoff.
 */
export function ModelHoverCard({ model, children }: ModelHoverCardProps) {
  return (
    <HoverCard openDelay={400} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="right" sideOffset={8} className="w-72">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <ProviderIcon
              provider={model.provider}
              className="mt-0.5 h-5 w-5"
            />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{model.name}</h4>
              <p className="text-muted-foreground text-xs">
                {getProviderDisplayName(model.provider)}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">{model.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {model.features.map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {featureLabels[feature]}
              </Badge>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Knowledge cutoff: {model.knowledgeCutoff}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
