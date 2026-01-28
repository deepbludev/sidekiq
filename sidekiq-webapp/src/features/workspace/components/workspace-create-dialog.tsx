"use client";

import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sidekiq/ui/dialog";
import {
  WorkspaceForm,
  type WorkspaceFormValues,
} from "@sidekiq/workspace/components/workspace-form";
import { api } from "@sidekiq/shared/trpc/react";
import { toast } from "sonner";

interface WorkspaceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for creating a new workspace.
 * Uses WorkspaceForm component for the form fields.
 *
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when open state changes
 */
export function WorkspaceCreateDialog({
  open,
  onOpenChange,
}: WorkspaceCreateDialogProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const createMutation = api.workspace.create.useMutation({
    onSuccess: (workspace) => {
      void utils.workspace.list.invalidate();
      if (!workspace) return;
      toast.success(`Workspace "${workspace.name}" created!`);
      onOpenChange(false);
      // Navigate to workspace settings
      router.push(`/settings/teams?team=${workspace.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  /**
   * Handle form submission.
   * @param values - Form values from WorkspaceForm
   */
  const handleSubmit = async (values: WorkspaceFormValues) => {
    await createMutation.mutateAsync(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Workspace</DialogTitle>
          <DialogDescription>
            Workspaces let you collaborate with others and share Sidekiqs.
          </DialogDescription>
        </DialogHeader>

        <WorkspaceForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
