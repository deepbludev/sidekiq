"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@sidekiq/server/better-auth/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@sidekiq/lib/validations/auth";
import { Button } from "@sidekiq/components/ui/button";
import { Input } from "@sidekiq/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@sidekiq/components/ui/form";

/**
 * Forgot password form to request password reset email
 */
export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setIsLoading(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: "/reset-password",
      });

      if (error) {
        // Don't reveal if email exists for security
        toast.error("Failed to send reset email. Please try again.");
        return;
      }

      setIsSubmitted(true);
      toast.success("If an account exists, you'll receive a reset email");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <p className="text-zinc-300">
          If an account exists with that email, we&apos;ve sent you a password reset
          link.
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Please check your email and follow the instructions.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-200">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="animate-spin" />}
          Send Reset Link
        </Button>
      </form>
    </Form>
  );
}
