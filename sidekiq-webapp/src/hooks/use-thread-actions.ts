"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@sidekiq/trpc/react";

interface UseThreadActionsProps {
  /** Currently active thread ID (for redirect after delete) */
  activeThreadId?: string | null;
}

/**
 * Hook providing thread action mutations with optimistic updates.
 *
 * Includes: delete, archive, unarchive, togglePin, rename
 * Handles cache invalidation and error rollback.
 *
 * @param props - Configuration options
 * @param props.activeThreadId - Currently active thread ID for navigation after delete/archive
 * @returns Object containing mutation functions and loading states
 *
 * @example
 * ```tsx
 * const { deleteThread, archiveThread, isDeleting } = useThreadActions({
 *   activeThreadId: currentThreadId,
 * });
 *
 * // Delete with confirmation
 * deleteThread({ threadId: "abc123" });
 *
 * // Archive with undo toast
 * archiveThread({ threadId: "abc123" });
 * ```
 */
export function useThreadActions({
  activeThreadId,
}: UseThreadActionsProps = {}) {
  const router = useRouter();
  const utils = api.useUtils();

  // Delete mutation - requires confirmation dialog
  const deleteMutation = api.thread.delete.useMutation({
    onSuccess: (data) => {
      // If deleted active thread, navigate to new chat
      if (data.deletedId === activeThreadId) {
        router.push("/chat");
      }
    },
    onError: (error) => {
      toast.error("Failed to delete conversation", {
        description: error.message,
      });
    },
    onSettled: () => {
      void utils.thread.list.invalidate();
    },
  });

  // Archive mutation with toast and undo
  const archiveMutation = api.thread.archive.useMutation({
    onMutate: async ({ threadId }) => {
      await utils.thread.list.cancel();
      const previousThreads = utils.thread.list.getData();

      // Optimistic update - hide from list
      utils.thread.list.setData(undefined, (old) =>
        old?.map((t) => (t.id === threadId ? { ...t, isArchived: true } : t)),
      );

      return { previousThreads };
    },
    onSuccess: (data) => {
      toast.success("Conversation archived", {
        action: {
          label: "Undo",
          onClick: () => unarchiveMutation.mutate({ threadId: data.id }),
        },
        duration: 5000,
      });

      // If archived active thread, navigate to new chat
      if (data.id === activeThreadId) {
        router.push("/chat");
      }
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousThreads) {
        utils.thread.list.setData(undefined, context.previousThreads);
      }
      toast.error("Failed to archive conversation", {
        description: error.message,
      });
    },
    onSettled: () => {
      void utils.thread.list.invalidate();
    },
  });

  // Unarchive mutation
  const unarchiveMutation = api.thread.unarchive.useMutation({
    onMutate: async ({ threadId }) => {
      await utils.thread.list.cancel();
      const previousThreads = utils.thread.list.getData();

      utils.thread.list.setData(undefined, (old) =>
        old?.map((t) => (t.id === threadId ? { ...t, isArchived: false } : t)),
      );

      return { previousThreads };
    },
    onSuccess: () => {
      toast.success("Conversation restored");
    },
    onError: (error, _variables, context) => {
      if (context?.previousThreads) {
        utils.thread.list.setData(undefined, context.previousThreads);
      }
      toast.error("Failed to restore conversation", {
        description: error.message,
      });
    },
    onSettled: () => {
      void utils.thread.list.invalidate();
    },
  });

  // Toggle pin mutation with optimistic update
  const togglePinMutation = api.thread.togglePin.useMutation({
    onMutate: async ({ threadId }) => {
      await utils.thread.list.cancel();
      const previousThreads = utils.thread.list.getData();

      utils.thread.list.setData(undefined, (old) =>
        old?.map((t) =>
          t.id === threadId ? { ...t, isPinned: !t.isPinned } : t,
        ),
      );

      return { previousThreads };
    },
    onError: (error, _variables, context) => {
      if (context?.previousThreads) {
        utils.thread.list.setData(undefined, context.previousThreads);
      }
      toast.error("Failed to update pin status", {
        description: error.message,
      });
    },
    onSettled: () => {
      void utils.thread.list.invalidate();
    },
  });

  // Rename mutation
  const renameMutation = api.thread.rename.useMutation({
    onMutate: async ({ threadId, title }) => {
      await utils.thread.list.cancel();
      const previousThreads = utils.thread.list.getData();

      utils.thread.list.setData(undefined, (old) =>
        old?.map((t) => (t.id === threadId ? { ...t, title } : t)),
      );

      return { previousThreads };
    },
    onError: (error, _variables, context) => {
      if (context?.previousThreads) {
        utils.thread.list.setData(undefined, context.previousThreads);
      }
      toast.error("Failed to rename conversation", {
        description: error.message,
      });
    },
    onSettled: () => {
      void utils.thread.list.invalidate();
    },
  });

  return {
    deleteThread: deleteMutation.mutate,
    archiveThread: archiveMutation.mutate,
    unarchiveThread: unarchiveMutation.mutate,
    togglePin: togglePinMutation.mutate,
    renameThread: renameMutation.mutate,
    isDeleting: deleteMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isRenaming: renameMutation.isPending,
  };
}
