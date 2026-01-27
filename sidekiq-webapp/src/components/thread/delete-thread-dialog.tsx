"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@sidekiq/ui/alert-dialog";

interface DeleteThreadDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when delete is confirmed */
  onConfirm: () => void;
  /** Title of the thread being deleted */
  threadTitle: string | null;
  /** Whether delete is in progress */
  isDeleting?: boolean;
}

/**
 * Confirmation dialog for permanent thread deletion.
 *
 * Displays a warning message and suggests archiving as a recoverable alternative.
 * Shows loading state while delete is in progress.
 *
 * @example
 * ```tsx
 * <DeleteThreadDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   onConfirm={() => deleteThread({ threadId })}
 *   threadTitle="My conversation"
 *   isDeleting={isPending}
 * />
 * ```
 */
export function DeleteThreadDialog({
  open,
  onOpenChange,
  onConfirm,
  threadTitle,
  isDeleting = false,
}: DeleteThreadDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;
            {threadTitle ?? "this conversation"}&quot;. This action cannot be
            undone.
            <br />
            <br />
            If you want to hide it temporarily, consider archiving instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
