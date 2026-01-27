"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { authClient } from "@sidekiq/server/better-auth/client";
import { signInSchema, type SignInInput } from "@sidekiq/lib/validations/auth";
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

interface SignInFormProps {
  callbackURL?: string;
}

/**
 * Sign in form with email/password authentication
 */
export function SignInForm({ callbackURL = "/chat" }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInInput) {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL,
      });

      if (error) {
        toast.error(error.message ?? "Invalid email or password");
        return;
      }

      toast.success("Signed in successfully");
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
              <div className="flex items-center justify-between">
                <FormLabel className="text-foreground">Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  Forgot password?
                </Link>
              </div>
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
          Sign In
        </Button>
      </form>
    </Form>
  );
}
