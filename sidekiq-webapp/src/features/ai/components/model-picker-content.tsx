"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@sidekiq/ui/command";
import {
  AVAILABLE_MODELS,
  getProviders,
  type ModelConfig,
  type Provider,
} from "../api/models-metadata";
import { getProviderDisplayName } from "@sidekiq/shared/icons/provider-icons";
import { ModelItem } from "./model-item";

interface ModelPickerContentProps {
  selectedModelId: string;
  favoriteModelIds: string[];
  defaultModelId: string | undefined;
  onSelect: (modelId: string) => void;
  onToggleFavorite: (modelId: string) => void;
}

/**
 * Popover content for the model picker.
 * Includes fuzzy search, favorites section, and provider-grouped models.
 */
export function ModelPickerContent({
  selectedModelId,
  favoriteModelIds,
  defaultModelId,
  onSelect,
  onToggleFavorite,
}: ModelPickerContentProps) {
  const [search, setSearch] = useState("");

  // Fuse.js instance for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(AVAILABLE_MODELS, {
        keys: [
          { name: "name", weight: 2 },
          { name: "provider", weight: 1 },
          { name: "description", weight: 0.5 },
        ],
        threshold: 0.4, // Allow typos
        ignoreLocation: true,
      }),
    [],
  );

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!search.trim()) return AVAILABLE_MODELS;
    return fuse.search(search).map((result) => result.item);
  }, [fuse, search]);

  // Get favorite models
  const favoriteModels = useMemo(
    () => AVAILABLE_MODELS.filter((m) => favoriteModelIds.includes(m.id)),
    [favoriteModelIds],
  );

  // Group filtered models by provider
  const providers = getProviders();
  const modelsByProvider = useMemo(() => {
    const grouped: Record<Provider, ModelConfig[]> = {} as Record<
      Provider,
      ModelConfig[]
    >;
    for (const provider of providers) {
      const models = filteredModels.filter((m) => m.provider === provider);
      if (models.length > 0) {
        grouped[provider] = models;
      }
    }
    return grouped;
  }, [filteredModels, providers]);

  const renderModelItem = (model: ModelConfig) => (
    <ModelItem
      key={model.id}
      model={model}
      isSelected={selectedModelId === model.id}
      isFavorite={favoriteModelIds.includes(model.id)}
      isDefault={defaultModelId === model.id}
      onSelect={onSelect}
      onToggleFavorite={onToggleFavorite}
    />
  );

  return (
    <Command shouldFilter={false} className="rounded-lg">
      <CommandInput
        placeholder="Search models..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[300px]">
        <CommandEmpty>No models found.</CommandEmpty>

        {/* Favorites section - only show if user has favorites and not searching */}
        {favoriteModels.length > 0 && !search.trim() && (
          <CommandGroup heading="Favorites">
            {favoriteModels.map(renderModelItem)}
          </CommandGroup>
        )}

        {/* Models grouped by provider */}
        {Object.entries(modelsByProvider).map(([provider, models]) => (
          <CommandGroup
            key={provider}
            heading={getProviderDisplayName(provider as Provider)}
          >
            {models.map(renderModelItem)}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
