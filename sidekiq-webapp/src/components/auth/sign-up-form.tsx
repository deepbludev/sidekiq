"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { authClient } from "@sidekiq/server/better-auth/client";
import { signUpSchema, type SignUpInput } from "@sidekiq/lib/validations/auth";
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

interface SignUpFormProps {
  callbackURL?: string;
}

/**
 * Sign up form with email/password registration
 */
export function SignUpForm({ callbackURL = "/chat" }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignUpInput) {
    setIsLoading(true);
    try {
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL,
      });

      if (error) {
        toast.error(error.message ?? "Failed to create account");
        return;
      }

      toast.success("Account created successfully");
      router.push(callbackURL);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">
                Confirm Password
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
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
          Create Account
        </Button>
      </form>
    </Form>
  );
}
