"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import type {
  CreateSidekiqInput,
  DeleteSidekiqInput,
  UpdateSidekiqInput,
} from "../validations";
import { api } from "@sidekiq/shared/trpc/react";

/**
 * Hook providing Sidekiq mutation actions with optimistic updates.
 *
 * Uses tRPC's useUtils for cache invalidation and optimistic updates.
 * All mutations show toast notifications on success/error.
 *
 * @returns Object with mutation functions and loading states
 *
 * @example
 * ```tsx
 * const { createSidekiq, deleteSidekiq, isCreating } = useSidekiqActions();
 *
 * const handleCreate = async () => {
 *   const result = await createSidekiq({ name: "My Assistant", instructions: "..." });
 *   if (result) router.push(`/sidekiqs/${result.id}/edit`);
 * };
 * ```
 */
export function useSidekiqActions() {
  const utils = api.useUtils();

  const createMutation = api.sidekiq.create.useMutation({
    onSuccess: () => {
      void utils.sidekiq.list.invalidate();
      toast.success("Sidekiq created successfully");
    },
    onError: (error) => {
      if (error.data?.code === "TOO_MANY_REQUESTS") {
        toast.error(error.message);
      } else if (error.data?.code === "CONFLICT") {
        toast.error("A Sidekiq with this name already exists");
      } else {
        toast.error("Failed to create Sidekiq");
      }
    },
  });

  const updateMutation = api.sidekiq.update.useMutation({
    onSuccess: () => {
      void utils.sidekiq.list.invalidate();
      toast.success("Sidekiq updated successfully");
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        toast.error("A Sidekiq with this name already exists");
      } else {
        toast.error("Failed to update Sidekiq");
      }
    },
  });

  const deleteMutation = api.sidekiq.delete.useMutation({
    onMutate: async ({ id }) => {
      // Cancel outgoing fetches
      await utils.sidekiq.list.cancel();

      // Snapshot previous value
      const previousData = utils.sidekiq.list.getData();

      // Optimistically remove from list
      utils.sidekiq.list.setData(undefined, (old) =>
        old?.filter((s) => s.id !== id),
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.sidekiq.list.setData(undefined, context.previousData);
      }
      toast.error("Failed to delete Sidekiq");
    },
    onSuccess: () => {
      toast.success("Sidekiq deleted");
    },
    onSettled: () => {
      void utils.sidekiq.list.invalidate();
    },
  });

  const toggleFavoriteMutation = api.sidekiq.toggleFavorite.useMutation({
    onMutate: async ({ id }) => {
      await utils.sidekiq.list.cancel();
      const previousData = utils.sidekiq.list.getData();

      // Optimistically toggle favorite
      utils.sidekiq.list.setData(undefined, (old) =>
        old?.map((s) =>
          s.id === id ? { ...s, isFavorite: !s.isFavorite } : s,
        ),
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        utils.sidekiq.list.setData(undefined, context.previousData);
      }
      toast.error("Failed to update favorite");
    },
    onSettled: () => {
      void utils.sidekiq.list.invalidate();
    },
  });

  const duplicateMutation = api.sidekiq.duplicate.useMutation({
    onSuccess: (result) => {
      void utils.sidekiq.list.invalidate();
      if (result) {
        toast.success(`Created "${result.name}"`);
      }
    },
    onError: () => {
      toast.error("Failed to duplicate Sidekiq");
    },
  });

  // Wrapped functions with stable references
  const createSidekiq = useCallback(
    async (input: CreateSidekiqInput) => {
      try {
        return await createMutation.mutateAsync(input);
      } catch {
        return null;
      }
    },
    [createMutation],
  );

  const updateSidekiq = useCallback(
    async (input: UpdateSidekiqInput) => {
      try {
        return await updateMutation.mutateAsync(input);
      } catch {
        return null;
      }
    },
    [updateMutation],
  );

  const deleteSidekiq = useCallback(
    async (input: DeleteSidekiqInput) => {
      try {
        return await deleteMutation.mutateAsync(input);
      } catch {
        return null;
      }
    },
    [deleteMutation],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      try {
        return await toggleFavoriteMutation.mutateAsync({ id });
      } catch {
        return null;
      }
    },
    [toggleFavoriteMutation],
  );

  const duplicateSidekiq = useCallback(
    async (id: string) => {
      try {
        return await duplicateMutation.mutateAsync({ id });
      } catch {
        return null;
      }
    },
    [duplicateMutation],
  );

  return {
    createSidekiq,
    updateSidekiq,
    deleteSidekiq,
    toggleFavorite,
    duplicateSidekiq,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
  };
}
