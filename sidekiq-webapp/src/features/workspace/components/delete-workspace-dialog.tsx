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

interface DeleteWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  workspaceName: string;
  memberCount: number;
  isDeleting?: boolean;
}

/**
 * Type-to-confirm deletion dialog for Workspaces.
 * Per CONTEXT.md: user must type exact name to confirm.
 * Shows warning about member count and associated data.
 *
 * @param props.open - Whether the dialog is open
 * @param props.onOpenChange - Callback when dialog open state changes
 * @param props.onConfirm - Callback when deletion is confirmed
 * @param props.workspaceName - Name of the workspace being deleted
 * @param props.memberCount - Number of members in the workspace
 * @param props.isDeleting - Whether deletion is in progress
 */
export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  onConfirm,
  workspaceName,
  memberCount,
  isDeleting = false,
}: DeleteWorkspaceDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText === workspaceName;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmText("");
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete &quot;{workspaceName}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All workspace data including shared
            Sidekiqs will be affected.
            {memberCount > 1 && (
              <span className="text-destructive mt-2 block">
                Warning: {memberCount - 1} other member
                {memberCount > 2 ? "s" : ""} will be removed from this
                workspace.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-workspace-name">
              Type{" "}
              <span className="font-mono font-semibold">{workspaceName}</span>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-workspace-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={workspaceName}
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!isConfirmed || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Workspace"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
