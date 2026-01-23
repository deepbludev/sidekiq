"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@sidekiq/trpc/react";
import { DEFAULT_MODEL, isValidModel } from "@sidekiq/lib/ai/models-metadata";

interface UseModelSelectionOptions {
  /** Initial model from thread (for existing threads) */
  threadModel?: string | null;
  /** Called when model changes (for tracking switches) */
  onModelChange?: (previousModel: string, newModel: string) => void;
}

interface UseModelSelectionReturn {
  /** Currently selected model ID */
  selectedModel: string;
  /** Change the selected model */
  setSelectedModel: (modelId: string) => void;
  /** User's favorite model IDs */
  favoriteModelIds: string[];
  /** User's default model ID */
  defaultModelId: string | undefined;
  /** Toggle a model's favorite status */
  toggleFavorite: (modelId: string) => void;
  /** Set a model as the user's default */
  setAsDefault: (modelId: string) => void;
  /** Whether preferences are loading */
  isLoading: boolean;
}

/**
 * Hook for managing model selection state with user preferences.
 *
 * Handles:
 * - Initial model from thread or user default
 * - Favorite toggling with optimistic updates
 * - Default model setting
 * - Model change tracking
 */
export function useModelSelection({
  threadModel,
  onModelChange,
}: UseModelSelectionOptions = {}): UseModelSelectionReturn {
  const utils = api.useUtils();

  // Fetch user preferences
  const { data: preferences, isLoading } = api.user.getPreferences.useQuery();

  // Mutation for updating preferences
  const updatePreferences = api.user.updateModelPreferences.useMutation({
    onMutate: async (input) => {
      // Cancel any outgoing refetches
      await utils.user.getPreferences.cancel();

      // Snapshot the previous value
      const previousPrefs = utils.user.getPreferences.getData();

      // Optimistically update
      if (previousPrefs) {
        const newPrefs = { ...previousPrefs };

        if (input.defaultModel !== undefined) {
          newPrefs.defaultModel = input.defaultModel;
        }

        if (input.toggleFavorite !== undefined) {
          const favorites = newPrefs.favoriteModels ?? [];
          if (favorites.includes(input.toggleFavorite)) {
            newPrefs.favoriteModels = favorites.filter(
              (id) => id !== input.toggleFavorite,
            );
          } else {
            newPrefs.favoriteModels = [...favorites, input.toggleFavorite];
          }
        }

        utils.user.getPreferences.setData(undefined, newPrefs);
      }

      return { previousPrefs };
    },
    onError: (_err, _input, context) => {
      // Rollback on error
      if (context?.previousPrefs) {
        utils.user.getPreferences.setData(undefined, context.previousPrefs);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      void utils.user.getPreferences.invalidate();
    },
  });

  // Determine initial model: thread model > user default > system default
  const getInitialModel = useCallback(() => {
    if (threadModel && isValidModel(threadModel)) {
      return threadModel;
    }
    if (preferences?.defaultModel && isValidModel(preferences.defaultModel)) {
      return preferences.defaultModel;
    }
    return DEFAULT_MODEL;
  }, [threadModel, preferences?.defaultModel]);

  const [selectedModel, setSelectedModelState] =
    useState<string>(getInitialModel);

  // Update selected model when preferences load (for default model)
  useEffect(() => {
    if (
      !threadModel &&
      preferences?.defaultModel &&
      isValidModel(preferences.defaultModel)
    ) {
      setSelectedModelState(preferences.defaultModel);
    }
  }, [threadModel, preferences?.defaultModel]);

  // Update selected model when thread model changes (navigating between threads)
  useEffect(() => {
    if (threadModel && isValidModel(threadModel)) {
      setSelectedModelState(threadModel);
    }
  }, [threadModel]);

  const setSelectedModel = useCallback(
    (modelId: string) => {
      if (!isValidModel(modelId)) return;

      const previousModel = selectedModel;
      setSelectedModelState(modelId);

      if (previousModel !== modelId) {
        onModelChange?.(previousModel, modelId);
      }
    },
    [selectedModel, onModelChange],
  );

  const toggleFavorite = useCallback(
    (modelId: string) => {
      updatePreferences.mutate({ toggleFavorite: modelId });
    },
    [updatePreferences],
  );

  const setAsDefault = useCallback(
    (modelId: string) => {
      updatePreferences.mutate({ defaultModel: modelId });
    },
    [updatePreferences],
  );

  return {
    selectedModel,
    setSelectedModel,
    favoriteModelIds: preferences?.favoriteModels ?? [],
    defaultModelId: preferences?.defaultModel,
    toggleFavorite,
    setAsDefault,
    isLoading,
  };
}
