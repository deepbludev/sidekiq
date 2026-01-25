"use client";

import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sidekiq/components/ui/dialog";
import {
  TeamForm,
  type TeamFormValues,
} from "@sidekiq/components/team/team-form";
import { api } from "@sidekiq/trpc/react";
import { toast } from "sonner";

interface TeamCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for creating a new team.
 * Uses TeamForm component for the form fields.
 *
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when open state changes
 */
export function TeamCreateDialog({
  open,
  onOpenChange,
}: TeamCreateDialogProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const createMutation = api.team.create.useMutation({
    onSuccess: (team) => {
      void utils.team.list.invalidate();
      if (team) {
        toast.success(`Team "${team.name}" created!`);
        onOpenChange(false);
        // Navigate to team settings
        router.push(`/settings/teams?team=${team.id}`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  /**
   * Handle form submission.
   * @param values - Form values from TeamForm
   */
  const handleSubmit = async (values: TeamFormValues) => {
    await createMutation.mutateAsync(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Team</DialogTitle>
          <DialogDescription>
            Teams let you collaborate with others and share Sidekiqs.
          </DialogDescription>
        </DialogHeader>

        <TeamForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
