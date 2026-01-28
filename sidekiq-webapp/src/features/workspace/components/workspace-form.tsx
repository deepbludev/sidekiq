"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@sidekiq/ui/button";
import { Input } from "@sidekiq/ui/input";
import { Label } from "@sidekiq/ui/label";
import { AvatarPicker } from "@sidekiq/sidekiqs/components/avatar-picker";
import { WorkspaceAvatar } from "@sidekiq/workspace/components/workspace-avatar";
import type { SidekiqAvatar } from "@sidekiq/shared/db/schema";

const workspaceFormSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name must be at most 100 characters"),
  avatar: z.object({
    type: z.enum(["initials", "emoji"]),
    color: z.string(),
    emoji: z.string().optional(),
  }),
});

export type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

interface WorkspaceFormProps {
  defaultValues?: Partial<WorkspaceFormValues>;
  onSubmit: (values: WorkspaceFormValues) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

/**
 * Reusable workspace form component.
 * Used for both creating and editing workspaces.
 *
 * @param defaultValues - Pre-fill form values for editing
 * @param onSubmit - Async handler for form submission
 * @param submitLabel - Button text (default: "Create Workspace")
 * @param isSubmitting - Disables form during submission
 */
export function WorkspaceForm({
  defaultValues,
  onSubmit,
  submitLabel = "Create Workspace",
  isSubmitting = false,
}: WorkspaceFormProps) {
  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      avatar: defaultValues?.avatar ?? { type: "initials", color: "#6366f1" },
    },
    mode: "onChange",
  });

  const avatar = form.watch("avatar");
  const name = form.watch("name");

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start gap-6">
        {/* Avatar Picker */}
        <div className="space-y-2">
          <Label>Avatar</Label>
          <AvatarPicker
            value={avatar as SidekiqAvatar}
            onChange={(newAvatar) =>
              form.setValue(
                "avatar",
                newAvatar as WorkspaceFormValues["avatar"],
              )
            }
            name={name || "Workspace"}
          />
        </div>

        {/* Name Input */}
        <div className="flex-1 space-y-2">
          <Label htmlFor="workspace-name">Workspace Name</Label>
          <Input
            id="workspace-name"
            placeholder="My awesome workspace"
            {...form.register("name")}
            disabled={isSubmitting}
            maxLength={100}
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-sm">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-muted/50 rounded-lg border p-4">
        <p className="text-muted-foreground mb-2 text-sm">Preview</p>
        <div className="flex items-center gap-3">
          <WorkspaceAvatar
            avatar={avatar as SidekiqAvatar}
            name={name || "Workspace"}
            size="lg"
          />
          <span className="font-medium">{name || "Workspace Name"}</span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!form.formState.isValid || isSubmitting}
      >
        {isSubmitting ? "Creating..." : submitLabel}
      </Button>
    </form>
  );
}
