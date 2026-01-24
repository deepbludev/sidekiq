"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { Button } from "@sidekiq/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@sidekiq/components/ui/form";
import { Input } from "@sidekiq/components/ui/input";
import { Textarea } from "@sidekiq/components/ui/textarea";
import {
  sidekiqFormSchema,
  type SidekiqFormValues,
  type SidekiqAvatar,
} from "@sidekiq/lib/validations/sidekiq";
import { createDefaultAvatar } from "@sidekiq/lib/utils/avatar";
import { useSidekiqActions } from "@sidekiq/hooks/use-sidekiq-actions";

import { AvatarPicker } from "./avatar-picker";
import { ConversationStarters } from "./conversation-starters";
import { InstructionsEditor } from "./instructions-editor";
import { SidekiqPreview } from "./sidekiq-preview";

interface SidekiqFormProps {
  mode: "create" | "edit";
  initialData?: Partial<SidekiqFormValues> & { id?: string };
  onSuccess?: (id: string) => void;
}

const DEFAULT_AVATAR: SidekiqAvatar = { type: "initials", color: "#6366f1" };

/**
 * Main form for creating and editing Sidekiqs.
 * Uses React Hook Form with Zod validation.
 * Split layout: form on left, live preview on right.
 *
 * @param mode - "create" or "edit"
 * @param initialData - Pre-fill form for editing
 * @param onSuccess - Callback after successful save
 */
export function SidekiqForm({
  mode,
  initialData,
  onSuccess,
}: SidekiqFormProps) {
  const router = useRouter();
  const { createSidekiq, updateSidekiq, isCreating, isUpdating } =
    useSidekiqActions();

  const form = useForm<SidekiqFormValues>({
    resolver: zodResolver(sidekiqFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      instructions: initialData?.instructions ?? "",
      conversationStarters: initialData?.conversationStarters ?? [],
      defaultModel: initialData?.defaultModel ?? null,
      avatar: initialData?.avatar ?? DEFAULT_AVATAR,
    },
    mode: "onChange", // Inline validation as user types
  });

  // Watch form values for live preview
  const watchedValues = useWatch({ control: form.control });
  const name = watchedValues.name ?? "";
  const description = watchedValues.description ?? "";
  const rawAvatar = watchedValues.avatar;
  // Ensure avatar has all required fields (useWatch can return partial values during hydration)
  const avatar: SidekiqAvatar =
    rawAvatar?.type && rawAvatar?.color
      ? { type: rawAvatar.type, color: rawAvatar.color, emoji: rawAvatar.emoji }
      : DEFAULT_AVATAR;
  const conversationStarters = watchedValues.conversationStarters ?? [];

  // Auto-generate avatar color when name changes (only on create mode with default color)
  // Once user customizes avatar, auto-generation stops
  useEffect(() => {
    const currentAvatar = form.getValues("avatar");
    // Only auto-generate if:
    // 1. Name has content
    // 2. Using initials type
    // 3. Color is still the default (#6366f1)
    // 4. This is a new sidekiq (mode === "create")
    // 5. Avatar field hasn't been touched by user
    if (
      mode === "create" &&
      name.trim() &&
      currentAvatar.type === "initials" &&
      currentAvatar.color === "#6366f1" &&
      !form.formState.dirtyFields.avatar
    ) {
      const newAvatar = createDefaultAvatar(name);
      if (newAvatar.color !== currentAvatar.color) {
        form.setValue("avatar", newAvatar, { shouldDirty: false });
      }
    }
  }, [name, mode, form]);

  // Track dirty state for unsaved changes warning
  // Must destructure to subscribe to formState changes (React Hook Form optimization)
  const { isDirty } = form.formState;

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: SidekiqFormValues) => {
    if (mode === "create") {
      const result = await createSidekiq(data);
      if (result) {
        form.reset(data); // Clear dirty state
        onSuccess?.(result.id);
        router.push(`/sidekiqs/${result.id}/edit`);
      }
    } else if (initialData?.id) {
      const result = await updateSidekiq({ id: initialData.id, ...data });
      if (result) {
        form.reset(data); // Clear dirty state
        onSuccess?.(result.id);
      }
    }
  };

  const isSubmitting = isCreating || isUpdating;

  // Character count helpers
  const getCharCountClass = (current: number, max: number) => {
    if (current >= max) return "text-destructive";
    if (current >= max * 0.9) return "text-amber-500";
    return "text-muted-foreground";
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left: Form */}
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Assistant"
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span
                      className={`text-xs ${getCharCountClass(field.value?.length ?? 0, 100)}`}
                    >
                      {field.value?.length ?? 0}/100
                    </span>
                  </div>
                </FormItem>
              )}
            />

            {/* Avatar picker */}
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <AvatarPicker
                      name={name || "Sidekiq"}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose initials or emoji with a custom color
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A helpful assistant that..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      maxLength={500}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Brief description shown in cards and lists
                    </FormDescription>
                    <span
                      className={`text-xs ${getCharCountClass(field.value?.length ?? 0, 500)}`}
                    >
                      {field.value?.length ?? 0}/500
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instructions field */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Instructions *</FormLabel>
                  <FormControl>
                    <InstructionsEditor
                      value={field.value}
                      onChange={field.onChange}
                      maxLength={8000}
                      error={fieldState.error?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conversation Starters */}
            <FormField
              control={form.control}
              name="conversationStarters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conversation Starters</FormLabel>
                  <FormControl>
                    <ConversationStarters
                      value={field.value}
                      onChange={field.onChange}
                      maxItems={6}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription>
                    Suggested prompts to help users start conversations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/sidekiqs")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {isSubmitting ? (
                  mode === "create" ? (
                    "Creating..."
                  ) : (
                    "Saving..."
                  )
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    {mode === "create" ? "Create Sidekiq" : "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right: Preview */}
      <div className="hidden lg:block">
        <div className="sticky top-8">
          <SidekiqPreview
            name={name}
            description={description ?? ""}
            avatar={avatar}
            conversationStarters={conversationStarters}
          />
        </div>
      </div>
    </div>
  );
}
