"use client";

import { useState } from "react";

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
import { Input } from "@sidekiq/ui/input";
import { Label } from "@sidekiq/ui/label";
import { Checkbox } from "@sidekiq/ui/checkbox";

interface DeleteSidekiqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (deleteThreads: boolean) => void;
  sidekiqName: string;
  threadCount: number;
  isDeleting?: boolean;
}

/**
 * Type-to-confirm deletion dialog for Sidekiqs.
 * Per CONTEXT.md: user must type exact name to confirm.
 * Offers option to also delete associated conversations.
 *
 * @param props.open - Whether the dialog is open
 * @param props.onOpenChange - Callback when dialog open state changes
 * @param props.onConfirm - Callback when deletion is confirmed
 * @param props.sidekiqName - Name of the Sidekiq being deleted
 * @param props.threadCount - Number of threads using this Sidekiq
 * @param props.isDeleting - Whether deletion is in progress
 */
export function DeleteSidekiqDialog({
  open,
  onOpenChange,
  onConfirm,
  sidekiqName,
  threadCount,
  isDeleting = false,
}: DeleteSidekiqDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [deleteThreads, setDeleteThreads] = useState(false);

  const isConfirmed = confirmText === sidekiqName;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmText("");
      setDeleteThreads(false);
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{sidekiqName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Type the Sidekiq name to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Type{" "}
              <span className="font-mono font-semibold">{sidekiqName}</span> to
              confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={sidekiqName}
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>

          {threadCount > 0 && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="delete-threads"
                checked={deleteThreads}
                onCheckedChange={(checked) =>
                  setDeleteThreads(checked === true)
                }
                disabled={isDeleting}
              />
              <Label
                htmlFor="delete-threads"
                className="text-muted-foreground text-sm leading-relaxed"
              >
                Also delete {threadCount} conversation
                {threadCount > 1 ? "s" : ""} using this Sidekiq
              </Label>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(deleteThreads)}
            disabled={!isConfirmed || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Sidekiq"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
