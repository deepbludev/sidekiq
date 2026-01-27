"use client";

import { useState } from "react";

import { SidekiqList } from "@sidekiq/sidekiqs/components/sidekiq-list";
import { DeleteSidekiqDialog } from "@sidekiq/sidekiqs/components/delete-sidekiq-dialog";
import { useSidekiqActions } from "@sidekiq/sidekiqs/hooks/use-sidekiq-actions";

interface DeleteDialogState {
  open: boolean;
  id: string;
  name: string;
  threadCount: number;
}

/**
 * Sidekiqs list page.
 * Shows all user's Sidekiqs with grid/list view, search, and actions.
 *
 * Features:
 * - Grid/list view toggle with persistence
 * - Search with fuzzy matching
 * - Delete with type-to-confirm dialog
 * - Actions: edit, duplicate, favorite, delete
 */
export default function SidekiqsPage() {
  const { deleteSidekiq, isDeleting } = useSidekiqActions();
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    id: "",
    name: "",
    threadCount: 0,
  });

  const handleOpenDeleteDialog = (
    id: string,
    name: string,
    threadCount: number,
  ) => {
    setDeleteDialog({ open: true, id, name, threadCount });
  };

  const handleConfirmDelete = async (deleteThreads: boolean) => {
    await deleteSidekiq({ id: deleteDialog.id, deleteThreads });
    setDeleteDialog({ open: false, id: "", name: "", threadCount: 0 });
  };

  return (
    <div className="mx-auto h-full max-w-4xl overflow-y-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sidekiqs</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage your custom AI assistants
        </p>
      </div>

      <SidekiqList onOpenDeleteDialog={handleOpenDeleteDialog} />

      <DeleteSidekiqDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onConfirm={handleConfirmDelete}
        sidekiqName={deleteDialog.name}
        threadCount={deleteDialog.threadCount}
        isDeleting={isDeleting}
      />
    </div>
  );
}
