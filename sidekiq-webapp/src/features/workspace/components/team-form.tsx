"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@sidekiq/ui/button";
import { Input } from "@sidekiq/ui/input";
import { Label } from "@sidekiq/ui/label";
import { AvatarPicker } from "@sidekiq/sidekiqs/components/avatar-picker";
import { TeamAvatar } from "@sidekiq/workspace/components/team-avatar";
import type { SidekiqAvatar } from "@sidekiq/shared/db/schema";

const teamFormSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be at most 100 characters"),
  avatar: z.object({
    type: z.enum(["initials", "emoji"]),
    color: z.string(),
    emoji: z.string().optional(),
  }),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  defaultValues?: Partial<TeamFormValues>;
  onSubmit: (values: TeamFormValues) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

/**
 * Reusable team form component.
 * Used for both creating and editing teams.
 *
 * @param defaultValues - Pre-fill form values for editing
 * @param onSubmit - Async handler for form submission
 * @param submitLabel - Button text (default: "Create Team")
 * @param isSubmitting - Disables form during submission
 */
export function TeamForm({
  defaultValues,
  onSubmit,
  submitLabel = "Create Team",
  isSubmitting = false,
}: TeamFormProps) {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
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
              form.setValue("avatar", newAvatar as TeamFormValues["avatar"])
            }
            name={name || "Team"}
          />
        </div>

        {/* Name Input */}
        <div className="flex-1 space-y-2">
          <Label htmlFor="team-name">Team Name</Label>
          <Input
            id="team-name"
            placeholder="My awesome team"
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
          <TeamAvatar
            avatar={avatar as SidekiqAvatar}
            name={name || "Team"}
            size="lg"
          />
          <span className="font-medium">{name || "Team Name"}</span>
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
