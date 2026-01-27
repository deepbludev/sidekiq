"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@sidekiq/auth/api/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@sidekiq/auth/validations";
import { Button } from "@sidekiq/ui/button";
import { Input } from "@sidekiq/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@sidekiq/ui/form";

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
        <p className="text-muted-foreground">
          If an account exists with that email, we&apos;ve sent you a password
          reset link.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
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
              <FormLabel className="text-foreground">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
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
