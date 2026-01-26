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
} from "@sidekiq/components/ui/alert-dialog";
import { Input } from "@sidekiq/components/ui/input";
import { Label } from "@sidekiq/components/ui/label";

interface DeleteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  teamName: string;
  memberCount: number;
  isDeleting?: boolean;
}

/**
 * Type-to-confirm deletion dialog for Teams.
 * Per CONTEXT.md: user must type exact name to confirm.
 * Shows warning about member count and associated data.
 *
 * @param props.open - Whether the dialog is open
 * @param props.onOpenChange - Callback when dialog open state changes
 * @param props.onConfirm - Callback when deletion is confirmed
 * @param props.teamName - Name of the team being deleted
 * @param props.memberCount - Number of members in the team
 * @param props.isDeleting - Whether deletion is in progress
 */
export function DeleteTeamDialog({
  open,
  onOpenChange,
  onConfirm,
  teamName,
  memberCount,
  isDeleting = false,
}: DeleteTeamDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText === teamName;

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
          <AlertDialogTitle>Delete &quot;{teamName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All team data including shared
            Sidekiqs will be affected.
            {memberCount > 1 && (
              <span className="text-destructive mt-2 block">
                Warning: {memberCount - 1} other member
                {memberCount > 2 ? "s" : ""} will be removed from this team.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-team-name">
              Type <span className="font-mono font-semibold">{teamName}</span>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-team-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={teamName}
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
            {isDeleting ? "Deleting..." : "Delete Team"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
